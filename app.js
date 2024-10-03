// app.js

const express = require('express');
const exphbs = require('express-handlebars');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const path = require('path');
const sharp = require('sharp'); // Importar Sharp
require('dotenv').config();
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

const app = express();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});



// Configuración de la conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
  
  // Si estás en producción (Heroku), se requiere SSL, pero no en desarrollo local
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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

    res.render('index', { photos, photoCount }); // Pasar las fotos y el contador a la plantilla
  } catch (error) {
    console.error('Error loading photos:', error);
    res.status(500).send('Error loading photos');
  }
});

// Ruta de ca// Upload Route: Handle photo uploads

app.post('/upload', upload.array('photos', 10), async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: '❌No files uploaded. Please select files to upload.❌' });
  }

  try {
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
          .resize({ width: 800 })
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


// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal en el servidor!');
});





// init
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
