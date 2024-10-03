const express = require('express');
const exphbs = require('express-handlebars');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const path = require('path');
const sharp = require('sharp'); // Importar Sharp
require('dotenv').config();

const app = express();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Configuración de la base de datos PostgreSQL

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Para conexiones en producción en Heroku
  }
});

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
    cb('file type not allowed error'); // Mensaje de error
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
app.post('/upload', upload.array('photos', 20), async (req, res) => {
  const files = req.files;

  // Verifica si se excedió el límite de archivos
  if (!files || files.length === 0) {
      return res.status(400).send('No files uploaded');
  }

  if (files.length > 10) {
      return res.status(400).send('You are exceeding the upload limit of 10 photos.');
  }

  try {
      // Iterar sobre los archivos subidos
      for (const file of files) {
          // Comprimir la imagen usando Sharp
          const compressedBuffer = await sharp(file.buffer)
              .resize({ width: 800 }) // Ajusta el tamaño si es necesario
              .jpeg({ quality: 80 }) // Ajusta la calidad de la imagen
              .toBuffer();

          // Subir imagen comprimida a Cloudinary
          await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
                  if (error) {
                      console.error('Error uploading image:', error);
                      return reject('Error uploading image');
                  }

                  // Almacenar URL de imagen en PostgreSQL database
                  try {
                      const query = 'INSERT INTO photos (url) VALUES ($1)';
                      await pool.query(query, [result.url]);
                      resolve(); // Resolución de la promesa
                  } catch (err) {
                      console.error('Error saving image to database:', err);
                      reject('Error saving image to database');
                  }
              }).end(compressedBuffer);
          });
      }

      res.redirect('/'); // Redirigir a la galería
  } catch (err) {
      console.error('Error processing images:', err);
      res.status(500).send('Error processing images');
  }
});




// init
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
