const express = require('express');
const fs = require('fs');
const exphbs = require('express-handlebars');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config();
const vision = require('@google-cloud/vision');
const cors = require('cors');
const session = require('express-session'); // Asegúrate de instalar express-session

// Agregar este bloque de código aquí
const credentialsPath = path.join(__dirname, '/google-credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const client = new vision.ImageAnnotatorClient({
  credentials: credentials // Cargar las credenciales desde el archivo
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Agregar para manejar JSON

// Configuración de la sesión
app.use(session({
  secret: 'your-secret-key', // Cambia esto por una clave secreta más segura
  resave: false,
  saveUninitialized: true,
}));

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Configuración de la conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Solo para desarrollo; no usar en producción sin más ajustes de seguridad.
  },
});

// Ejemplo de consulta para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexión exitosa a la base de datos');
    
    // Prueba con una consulta
    const res = await client.query('SELECT NOW()');
    console.log('Fecha actual:', res.rows);

    client.release();  // Libera el cliente cuando termines
  } catch (err) {
    console.error('Error de conexión a la base de datos:', err);
  }
};

testConnection();

// Servir archivos estáticos (CSS, JS del cliente) desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuración del motor de plantillas Handlebars
app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Multer para manejar cargas de archivos (almacenamiento en memoria)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB como tamaño máximo
  },
  
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; // Tipos de archivo permitidos
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only files with the following extensions are allowed: jpeg, jpg, png, gif')); // Improved error message 
  }
});

// Ruta de inicio: Mostrar la galería de fotos
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM photos ORDER BY id DESC');
    const photos = result.rows;

    // Consulta para contar el número total de fotos
    const photoCountResult = await pool.query('SELECT COUNT(*) FROM photos');
    const photoCount = photoCountResult.rows[0].count; // Obtener el número de fotos subidas
    console.log('Número de fotos subidas:', photoCount);

    res.render('index', { photos, photoCount, user: req.session.user }); // Pasar las fotos, el contador y la sesión del usuario a la plantilla
  } catch (error) {
    console.error('Error loading photos:', error);
    res.status(500).send('Error loading photos');
  }
});

// Ruta de carga de fotos
app.post('/upload', upload.array('photos', 10), async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: '❌No files uploaded. Please select files to upload.❌' });
  }

  try {
    // Obtener URLs existentes de la base de datos para evitar duplicados
    const existingPhotosResult = await pool.query('SELECT url FROM photos');
    const existingPhotoUrls = existingPhotosResult.rows.map(row => row.url);
    
    // Filtrar archivos que ya existen en la base de datos
    const duplicates = files.filter(file => existingPhotoUrls.includes(file.originalname));
    
    if (duplicates.length > 0) {
      // Enviar un mensaje de error si hay fotos duplicadas
      return res.status(400).json({ error: '❌ Duplicate images detected. Please upload new images. ❌' });
    }

    const uploadPromises = files.map(async (file) => {
      try {
        // Verificar si la imagen tiene contenido inapropiado
        const [result] = await client.safeSearchDetection(file.buffer);
        const detections = result.safeSearchAnnotation;

        if (detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY' ||
            detections.violence === 'LIKELY' || detections.violence === 'VERY_LIKELY') {
          throw new Error('❌The image contains inappropriate content❌');
        }

        // Comprimir y subir la imagen si es segura
        const compressedBuffer = await sharp(file.buffer)
          .resize({ width: 1200, height: 675, fit: 'contain' }) // Para 16:9
          .jpeg({ quality: 80 })
          .toBuffer();

        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) {
              return reject(new Error('Error uploading image to Cloudinary'));
            }
            resolve(result);
          }).end(compressedBuffer);
        });

        // Insertar la URL de la imagen en la base de datos
        const query = 'INSERT INTO photos (url) VALUES ($1)';
        await pool.query(query, [uploadResult.url]);
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
        throw new Error(`Error processing file ${file.originalname}`);
      }
    });

    await Promise.all(uploadPromises);
    res.redirect('/'); // Redirigir a la galería
  } catch (err) {
    console.error('Error processing images:', err);
    res.status(500).json({ error: err.message || 'Error processing images' });
  }
});


// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
  req.session.user = null; // Limpia la sesión del usuario
  res.redirect('/'); // Redirige a la página principal
});


// Middleware para verificar si el usuario es administrador
function isAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(403).send('You do not have permission to access this section..');
  }
  
  if (req.session.user.username !== 'admin') { // Verificar que el nombre de usuario 
    return res.status(403).send('You do not have permission to access this section.');
  }
  
  next();
}

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { username, password } = req.body; 

  // verificar el nombre de usuario y la contraseña
  if (username === 'admin' && password === 'tomas2411') { 
    req.session.user = { username }; // Guardar información del usuario en la sesión
    return res.redirect('/'); // Redirigir a la página principal
  }

  res.status(401).json({ error: 'Unauthorized' });
});

// Ruta para eliminar una foto por ID
app.post('/delete-photo/:id', isAdmin, async (req, res) => {
  const { id } = req.params; // Obtener el ID de la imagen a eliminar
  console.log('ID de la imagen a eliminar:', id); // Diagnóstico

  // Verificar que el ID sea válido
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    // Consulta para obtener la URL de la imagen que se va a eliminar
    const result = await pool.query('SELECT url FROM photos WHERE id = $1', [id]);
    console.log('Resultado de la consulta:', result); // Diagnóstico

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageUrl = result.rows[0].url;

    // Eliminar la imagen de Cloudinary
    const publicId = imageUrl.split('/').pop().split('.')[0]; // Obtener el ID público de Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Eliminar la imagen de la base de datos
    await pool.query('DELETE FROM photos WHERE id = $1', [id]);
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Ruta para eliminar una foto por ID
app.delete('/delete-photo/:id', isAdmin, async (req, res) => {
  const { id } = req.params; // Obtener el ID de la imagen a eliminar
  console.log('ID de la imagen a eliminar:', id); // Diagnóstico

  // Verificar que el ID sea válido
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    // Consulta para obtener la URL de la imagen que se va a eliminar
    const result = await pool.query('SELECT url FROM photos WHERE id = $1', [id]);
    console.log('Resultado de la consulta:', result); // Diagnóstico

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageUrl = result.rows[0].url;

    // Eliminar la imagen de Cloudinary
    const publicId = imageUrl.split('/').pop().split('.')[0]; // Obtener el ID público de Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Eliminar la imagen de la base de datos
    await pool.query('DELETE FROM photos WHERE id = $1', [id]);
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});