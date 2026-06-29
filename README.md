# El Impostor — Diario de Mesa

App web estática en castellano para jugar a **El Impostor** en familia o con amigos. No usa anuncios, cuentas, base de datos ni servicios externos.

## Qué incluye

- Configuración de jugadores.
- 1 a 3 impostores.
- Categorías de palabras incluidas.
- Palabras personalizadas.
- Revelado privado por turnos.
- Temporizador opcional.
- Pantalla de votación.
- Resultado final con palabra e impostores.
- Estética de diario antiguo, sobria y premium.
- Preparada para GitHub Pages.

## Estructura

```txt
.
├── index.html
├── manifest.webmanifest
├── assets/
│   └── icon.svg
└── src/
    ├── app.js
    └── styles.css
```

## Cómo subirlo a GitHub

1. Crea un repositorio nuevo en GitHub.
2. Sube todos los archivos de esta carpeta.
3. Entra en **Settings → Pages**.
4. En **Build and deployment**, selecciona:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
5. Guarda los cambios.
6. GitHub generará una URL pública para jugar.

## Cómo probarlo en local

Puedes abrir `index.html` directamente en el navegador.

También puedes usar un servidor local:

```bash
python3 -m http.server 8080
```

Luego abre:

```txt
http://localhost:8080
```

## Personalizar palabras

Edita `src/app.js` y añade palabras dentro del objeto `categories`.

Ejemplo:

```js
"Nueva categoría": ["Palabra 1", "Palabra 2", "Palabra 3"]
```

## Notas

- Todo funciona en el navegador.
- No se envían datos a ningún servidor.
- Los últimos nombres de jugadores se guardan solo en el dispositivo mediante `localStorage`.
