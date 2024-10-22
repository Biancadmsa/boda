

#  Aplicación de Galería de Fotos

 ```
Este es un proyecto de galería de fotos de boda que permite a los usuarios subir imágenes y un administrador puede gestionar el eliminar las fotos.

 ```

## Funcionalidades 
```
- **Subida de Fotos**: Los usuarios pueden subir imágenes (JPEG, JPG, PNG, GIF).
- **Compresión de Imágenes**: Las imágenes subidas se comprimen antes de ser almacenadas en Cloudinary.
- **Detección de Contenido Inapropiado**: Las imágenes se revisan para detectar contenido explícito utilizando la API de Safe Search de Google Cloud Vision.
- **Galería de Fotos**: Muestra todas las fotos subidas, ordenadas por las más recientes.
- **Funcionalidad de Administrador**: Los usuarios administradores pueden eliminar fotos de la galería.
- **Autenticación de Usuarios**: Sistema básico de inicio de sesión para usuarios administradores.
 ```
## Tecnologías Utilizadas

```
- **Backend**: Node.js, Express.js, Multer, Cloudinary, PostgreSQL
- **Frontend**: Handlebars.js (para renderizar plantillas)
- **APIs**: Google Cloud Vision para detectar contenido explícito
- **Almacenamiento en la Nube**: Cloudinary para almacenar imágenes
- **Base de Datos**: PostgreSQL para almacenar metadatos de las imágenes (URLs)


 ```

## Configuración de PostgreSQL

La aplicación utiliza una base de datos PostgreSQL con el siguiente esquema:

```sql

CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Se agrega una restricción única al campo url para asegurar que no se almacenen URLs duplicadas en la base de dato:

ALTER TABLE photos ADD CONSTRAINT unique_url UNIQUE (url);

 ```


## Clona el repositorio
```
git clone https://github.com/Biancadmsa/galeria_imagenes_boda
cd galeria_imagenes_boda
 ```

## Instala las dependencias:
 ```
npm install
 ```

## Configura las variables de entorno:

 Variables de entorno:
Crea un archivo `.env  la raíz del proyecto con las siguientes variables de entorno:

 ```sql
# PostgreSQL Database (local or Heroku)
DB_USER=tu_usuario_pg
DB_HOST=127.0.0.1
DB_DATABASE=nombre_de_tu_base_de_datos
DB_PASSWORD=tu_clave_pg
DB_PORT=5432

# Cloudinary configuration
CLOUD_NAME=tu_cloud_name
CLOUD_API_KEY=tu_api_key
CLOUD_API_SECRET=tu_api_secret

# Google Cloud Vision credentials
GOOGLE_APPLICATION_CREDENTIALS=path_to_google_credentials.json

# Puerto del servidor
PORT=3000
SECRET_KEY=secretKey
E_APPLICATION_CREDENTIALS=path_to_google_credentials.json

 ```



## Conectate a PostgreSQL:

 ```
psql -U tu_usuario

 ```

## Crea la base de Datos

 ```sql
CREATE DATABASE  nombre de tu base de datos;

 ```

## Cambia al contexto de la nueva base de datos: 

 ```
\c nombre de tu base de datos;

 ```


## Configura PostgreSQL:

```sql
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

  En el archivo app.js, linea 196 hay un usuario y clave registrado, modificalo a tu gusto, para que puedas ingresar como administrador.
```

   


## Iniciar el servidor:

```bash
npm run start

```

## Abrir un navegador y navegar a:
 ```
 `http://localhost:3000`, 
  para ver la aplicación en funcionamiento.

 ```

 
## Consultas SQL Útiles;
```sql
SELECT * FROM photos;
 ```


