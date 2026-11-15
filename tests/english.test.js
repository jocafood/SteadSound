import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { englishImages, localizeImage } from '../frontend/i18n/images-en.js';

test('all catalog images have English presentation without changing records',()=>{
 const records=JSON.parse(fs.readFileSync(new URL('../backend/data/catalog.json',import.meta.url)));
 for(const record of records){
  assert.ok(englishImages[record.id],record.id);
  const en=localizeImage(record);
  assert.ok(en.title&&en.description&&en.altText);
  for(const field of ['id','imageUrl','sourceUrl','width','height','credit'])assert.equal(en[field],record[field]);
  assert.notEqual(en.description,record.description);
 }
});
