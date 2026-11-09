# Cumple de Fer

Invitación con confirmación de asistencia. Página estática en GitHub Pages; las respuestas se guardan en una Google Sheet a través de Apps Script.

- `index.html?i=<token>`: invitación personal con botones para confirmar
- `admin.html`: lista de quién va, quién no y quién no ha respondido (pide la clave de admin)
- `apps-script/Code.gs`: backend que se pega en la Google Sheet
- `privado/` (no se sube al repo): tokens de invitados y links para mandar

## Configurar el backend

1. Crea una Google Sheet nueva y renombra la pestaña a `Invitados`.
2. Pega el contenido de `privado/invitados.tsv` en la celda A1.
3. Extensiones → Apps Script. Borra lo que haya y pega `apps-script/Code.gs`. Guarda.
4. Configuración del proyecto (engrane) → Propiedades del script → agrega `ADMIN_KEY` con la clave que quieras.
5. Implementar → Nueva implementación → tipo **Aplicación web**. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario**. Autoriza los permisos.
6. Copia la URL que termina en `/exec` y pégala en `assets/config.js`.

Si cambias `Code.gs` después, usa Implementar → Administrar implementaciones → editar → Versión nueva, para que la URL no cambie.
