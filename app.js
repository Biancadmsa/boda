const express = require('express');
const exphbs = require('express-handlebars');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const path = require('path');
const sharp = require('sharp'); // Importar Sharp
require('dotenv').config();

const app = express();

// Cloudinary Configuration (using .env)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// PostgreSQL Database Configuration (using .env)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Serve static files (CSS, client-side JS) from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars template engine setup
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

// Multer for handling file uploads (in-memory storage)
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

// Home Route: Display photo gallery
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM photos ORDER BY id DESC');
    const photos = result.rows;
    res.render('index', { photos });
  } catch (error) {
    console.error('Error loading photos:', error);
    res.status(500).send('Error loading photos');
  }
});

// Upload Route: Handle photo uploads
app.post('/upload', upload.single('photo'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    // Comprimir la imagen usando Sharp
    const compressedBuffer = await sharp(file.buffer)
      .resize({ width: 800 }) // Ajusta el tamaño si es necesario
      .jpeg({ quality: 80 }) // Ajusta la calidad de la imagen
      .toBuffer();

    // Subir imagen comprimida a Cloudinary
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
      if (error) {
        console.error('Error uploading image:', error);
        return res.status(500).send('Error uploading image');
      }

      // Almacenar URL de imagen en PostgreSQL database
      try {
        const query = 'INSERT INTO photos (url) VALUES ($1)';
        await pool.query(query, [result.url]);
        res.redirect('/'); // Redirigir a la galería
      } catch (err) {
        console.error('Error saving image to database:', err);
        res.status(500).send('Error saving image to database');
      }
    }).end(compressedBuffer);
  } catch (err) {
    console.error('Error compressing image:', err);
    res.status(500).send('Error compressing image');
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
