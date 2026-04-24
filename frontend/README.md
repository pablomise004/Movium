# Frontend Movium

## Arranque del proyecto (Docker + React)

Este frontend consume la API PHP a traves de `API_BASE_URL`, definida en `src/config.js` y alimentada por la variable de entorno `REACT_APP_API_URL`.

Valor recomendado en desarrollo (sin CORS, usando proxy de React):

`REACT_APP_API_URL=/backend/api`

El `package.json` incluye:

`"proxy": "http://localhost:8080"`

Con eso, cuando React corre en `localhost:3000`, las llamadas a `/backend/api/...` se reenvian al backend Docker en `localhost:8080`.

## Pasos

1. Arranca los contenedores de backend en Docker Desktop (Apache/PHP, MariaDB y phpMyAdmin).
2. Verifica que Apache responde en `http://localhost:8080`.
3. En esta carpeta (`frontend`), instala dependencias:

```bash
npm install
```

4. Inicia React:

```bash
npm start
```

La app se abrira normalmente en `http://localhost:3000`.

## Scripts disponibles

- `npm start`: inicia el entorno de desarrollo.
- `npm test`: ejecuta tests en modo watch.
- `npm run build`: genera build de produccion.
