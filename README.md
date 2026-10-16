# AstroLab — NASA en español

Portal frontend educativo que consume **NASA Images API** para explorar imágenes astronómicas y **MyMemory Translation API** para traducir títulos y descripciones del inglés al español.

## Iniciar

1. Abrir la carpeta `astrolab` en VS Code.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.
4. Abrir la URL local indicada por Vite (usualmente http://localhost:5173/).

## Funciones

- Búsquedas, colecciones, imágenes y datos obtenidos de NASA Images API.
- Traducción automática al español (títulos del catálogo y contenido de las fichas), sin alterar la fuente científica.
- Caché de traducciones en el navegador para reducir solicitudes repetidas.
- Favoritos, consulta de detalles y paginación.
- Estados de carga y tratamiento de errores.

**Aviso**: MyMemory es un servicio externo gratuito, con límites de uso y sin garantía de traducción. Cuando no está disponible, AstroLab muestra el texto original en inglés. La exactitud de las traducciones automáticas puede variar. Las imágenes y sus metadatos pertenecen a sus respectivos titulares.

Servicios: https://images.nasa.gov/ y https://mymemory.translated.net/doc/spec.php
