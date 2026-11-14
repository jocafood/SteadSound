# SteadSound

Proyecto de sonificación de imágenes NASA para personas ciegas o con baja visión.

- [Backend Python: ejecución, Docker, pruebas e integración](backend/README.md).
- [Contrato de integración del equipo](docs/integracion/CONTRATO-DATOS.md).
- [Responsabilidades y decisiones](docs/integracion/README.md).

El backend está aislado en `backend/` para facilitar el merge con la interfaz y el motor de sonido. Desde esa carpeta, ejecutar `docker compose up --build` y abrir `http://localhost:8000/api/docs`.
