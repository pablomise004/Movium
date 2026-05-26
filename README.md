# Movium

Movium es una aplicación web para el seguimiento de rutinas de entrenamiento y ejercicios, dividida en dos componentes principales:

- **Frontend**: Aplicación en React que ofrece la interfaz de usuario adaptada y moderna.
- **Backend**: API REST desarrollada en PHP puro que sirve los datos y maneja autenticación JWT.

## Estructura del Proyecto

- `/frontend`: Código fuente de la interfaz web en React (`package.json`, `src/`).
- `/backend`: Lógica de negocio y endpoints de la API en PHP (`composer.json`, `api/`, `config/`).
- `Moviumpeque.sql`: Script SQL con la estructura inicial y datos por defecto de la base de datos MariaDB/MySQL.

## Arranque del Proyecto en Desarrollo

### 1. Base de Datos
1. Inicia tu servidor MySQL/MariaDB (puede ser local con XAMPP o mediante contenedores).
2. Crea una base de datos e importa el archivo `Moviumpeque.sql`.
3. Verifica la configuración de conexión en `backend/config/base_de_datos.php` según tus credenciales de base de datos local o en Docker.

### 2. Backend (API PHP)
Si utilizas el entorno Docker configurado, instala phpMyAdmin y MariaDB y linkéalos a la carpeta del proyecto:
1. Arranca tu servidor o contenedores para servir la carpeta `backend` en el puerto `8080`.
2. Verifica que Apache responda en `http://localhost:8082/backend/api/...`.
3. (Si es necesario) entra al directorio `backend` e instala dependencias de Composer:
   ```bash
   cd backend
   composer install
   ```

### 3. Frontend (React)
El frontend consume la API PHP a través del proxy configurado en su `package.json` hacia `http://localhost:8082`. Con esto se evitan problemas de CORS en desarrollo.

Pasos para lanzarlo:
1. Navega al directorio `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Inicia la aplicación React:
   ```bash
   npm start
   ```

La app se abrirá en tu navegador en `http://localhost:3000`. Cualquier solicitud a la API (por ejemplo `fetch('/backend/api/login.php')`) será redirigida a tu servidor PHP en el puerto 8080.

## Comandos Adicionales del Frontend
Dentro de la carpeta `frontend`:
- `npm run build`: Genera una copia optimizada del frontend para producción en el directorio `build/`.
- `npm test`: Corre la suite de pruebas unitarias.