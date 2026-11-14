import json
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app import app, create_app
from core.catalog import DATA
from core.images import prepare_image


@pytest.fixture
def client():
    return TestClient(app)


def test_real_catalog_and_downloads(client):
    response = client.get('/api/images')
    assert response.status_code == 200
    row = response.json()['images'][0]
    assert client.get('/api/images/' + row['id']).json() == {'image': row}
    preview = client.get(row['imageUrl'])
    assert preview.status_code == 200
    assert preview.headers['content-type'] == 'image/jpeg'
    with Image.open(BytesIO(preview.content)) as image:
        assert image.size == (row['width'], row['height'])
        assert image.mode == 'RGB'
        assert all(0 <= value <= 255 for value in image.getpixel((0, 0)))
    original = client.get(row['originalUrl'])
    assert 'attachment' in original.headers['content-disposition']
    assert original.content == (DATA / 'images' / row['id'] / f"original_{row['assetNumber']:03d}.jpg").read_bytes()


@pytest.mark.parametrize('route', ['/api/images/missing', '/api/images/missing/file', '/api/images/missing/original'])
def test_missing(client, route):
    response = client.get(route)
    assert response.status_code == 404
    assert response.json()['error']['code'] == 'IMAGE_NOT_FOUND'


def test_method(client):
    response = client.post('/api/images')
    assert response.status_code == 405
    assert response.headers['allow'] == 'GET'
    assert response.json()['error']['code'] == 'METHOD_NOT_ALLOWED'


def test_empty_catalog(tmp_path):
    (tmp_path / 'catalog.json').write_text('[]')
    assert TestClient(create_app(tmp_path)).get('/api/images').json() == {'images': []}


@pytest.mark.parametrize('extension,fmt', [('PNG', 'PNG'), ('jpeg', 'JPEG'), ('TIFF', 'TIFF')])
def test_prepare_and_serve_formats(tmp_path, extension, fmt):
    source = tmp_path / ('input.' + extension)
    Image.new('RGB', (8, 5), (120, 180, 220)).save(source, format=fmt)
    initial = source.read_bytes()
    prepared = prepare_image(source, tmp_path / 'images', 'test-image')
    row = {**prepared, 'title': 'Prueba', 'description': 'Descripción', 'altText': 'Alternativo', 'sourceUrl': 'https://www.nasa.gov/', 'credit': 'Prueba sintética', 'category': 'earth'}
    (tmp_path / 'catalog.json').write_text(json.dumps([row]))
    client = TestClient(create_app(tmp_path))
    preview = client.get(row['imageUrl'])
    assert preview.status_code == 200
    with Image.open(BytesIO(preview.content)) as image:
        assert image.size == (8, 5)
        assert image.mode == 'RGB'
    assert client.get(row['originalUrl']).content == initial
    if fmt == 'TIFF':
        assert row['imageFormat'] == 'png'
        assert client.get(row['originalUrl']).headers['content-type'] == 'image/tiff'


def test_transparency(tmp_path):
    source = tmp_path / 'alpha.png'
    Image.new('RGBA', (2, 2), (255, 0, 0, 0)).save(source)
    prepare_image(source, tmp_path / 'images', 'alpha')
    with Image.open(tmp_path / 'images/alpha/exploration_001.png') as image:
        assert image.getpixel((0, 0)) == (0, 0, 0)


def test_reject_scientific_tiff(tmp_path):
    source = tmp_path / 'science.tif'
    Image.new('I;16', (2, 2), 1000).save(source)
    with pytest.raises(ValueError, match='8 bits'):
        prepare_image(source, tmp_path / 'images', 'science')


def test_reject_multipage_and_false_extension(tmp_path):
    source = tmp_path / 'pages.tif'
    image = Image.new('RGB', (2, 2))
    image.save(source, save_all=True, append_images=[image])
    with pytest.raises(ValueError, match='una página'):
        prepare_image(source, tmp_path / 'images', 'pages')
    source = tmp_path / 'fake.jpg'
    image.save(source, format='PNG')
    with pytest.raises(ValueError, match='extensión'):
        prepare_image(source, tmp_path / 'images', 'fake')


def test_internal_error_is_json(tmp_path):
    (tmp_path / 'catalog.json').write_text('[]')
    api = create_app(tmp_path)
    @api.get('/failure')
    def failure():
        raise RuntimeError('private details')
    response = TestClient(api, raise_server_exceptions=False).get('/failure')
    assert response.status_code == 500
    assert response.json()['error']['code'] == 'INTERNAL_ERROR'
    assert 'private details' not in response.text


def test_numbered_files(tmp_path):
    source = tmp_path / 'test.png'
    Image.new('RGB', (2, 2)).save(source)
    row = prepare_image(source, tmp_path / 'images', 'numbered', 12)
    assert row['assetNumber'] == 12
    assert (tmp_path / 'images/numbered/original_012.png').exists()
    assert (tmp_path / 'images/numbered/exploration_012.png').exists()


def test_import_keeps_metadata_with_images(tmp_path, monkeypatch):
    from scripts import add_image
    import sys
    data = tmp_path / 'data'
    folder = data / 'images' / 'new-image'
    folder.mkdir(parents=True)
    metadata = {'id': 'new-image', 'title': 'Prueba', 'description': 'Descripción', 'altText': 'Alternativo', 'sourceUrl': 'https://www.nasa.gov/', 'credit': 'Sintética', 'category': 'earth'}
    metadata_path = folder / 'metadata.json'
    metadata_path.write_text(json.dumps(metadata))
    (data / 'catalog.json').write_text('[]')
    source = tmp_path / 'source.png'
    Image.new('RGB', (3, 2)).save(source)
    monkeypatch.setattr(add_image, 'DATA', data)
    from core.catalog import load_catalog
    monkeypatch.setattr(add_image, 'load_catalog', lambda: load_catalog(data))
    monkeypatch.setattr(sys, 'argv', ['add_image', str(source), '--metadata', str(metadata_path)])
    add_image.main()
    assert json.loads(metadata_path.read_text()) == metadata
    assert (folder / 'original_001.png').exists()
    assert (folder / 'exploration_001.png').exists()
    assert load_catalog(data)['new-image'].assetNumber == 1


def test_complete_catalog_integrity():
    from scripts.verify_catalog import verify_catalog
    assert verify_catalog() == len(json.loads((DATA / 'catalog.json').read_text()))


def test_all_catalog_routes(client):
    for row in client.get('/api/images').json()['images']:
        assert client.get('/api/images/' + row['id']).json() == {'image': row}
        preview = client.get(row['imageUrl'])
        assert preview.status_code == 200
        with Image.open(BytesIO(preview.content)) as image:
            assert image.size == (row['width'], row['height'])
            assert image.mode == 'RGB'
        original = client.get(row['originalUrl'])
        assert original.status_code == 200
        assert original.content == (DATA / 'images' / row['id'] / f"original_{row['assetNumber']:03d}.{row['originalFormat']}").read_bytes()


def test_sync_metadata_is_atomic_and_preserves_assets(tmp_path):
    import shutil
    from scripts.sync_metadata import sync_metadata
    from scripts.verify_catalog import verify_catalog
    data = tmp_path / 'data'
    shutil.copytree(DATA, data)
    rows = json.loads((data / 'catalog.json').read_text())
    folder = data / 'images' / rows[0]['id']
    assets = {p.name: p.read_bytes() for p in folder.iterdir() if p.suffix != '.json'}
    metadata_path = folder / 'metadata.json'
    metadata = json.loads(metadata_path.read_text())
    metadata['title'] = 'Título revisado por Kata'
    metadata_path.write_text(json.dumps(metadata))
    with pytest.raises(ValueError, match='difieren'):
        verify_catalog(data)
    sync_metadata(data)
    updated = json.loads((data / 'catalog.json').read_text())
    assert updated[0]['title'] == metadata['title']
    assert updated[0]['assetNumber'] == rows[0]['assetNumber']
    assert all((folder / name).read_bytes() == content for name, content in assets.items())
    verify_catalog(data)
    before = (data / 'catalog.json').read_bytes()
    metadata['id'] = 'wrong-id'
    metadata_path.write_text(json.dumps(metadata))
    with pytest.raises(ValueError, match='no coincide'):
        sync_metadata(data)
    assert (data / 'catalog.json').read_bytes() == before
