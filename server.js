const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection for metadata
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/imageUploadDB';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Create Image Schema
const imageSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  uploadDate: { type: Date, default: Date.now },
  s3Key: String
});

const Image = mongoose.model('Image', imageSchema);

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const s3Key = `${Date.now()}-${file.originalname}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype
    });

    await s3Client.send(command);

    // Save metadata to MongoDB
    const image = new Image({
      filename: s3Key,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      s3Key: s3Key
    });

    await image.save();

    res.json({ 
      message: 'File uploaded successfully',
      file: image 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

app.get('/api/images/:filename', async (req, res) => {
  try {
    const image = await Image.findOne({ filename: req.params.filename });
    
    if (!image) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Generate presigned URL with ResponseContentDisposition
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: image.s3Key,
      ResponseContentDisposition: `attachment; filename="${image.originalname}"`
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving file', error: error.message });
  }
});

app.get('/api/download/:filename', async (req, res) => {
  try {
    const image = await Image.findOne({ filename: req.params.filename });
    
    if (!image) {
      return res.status(404).json({ message: 'File not found' });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: image.s3Key
    });

    try {
      const s3Response = await s3Client.send(command);
      res.setHeader('Content-Type', s3Response.ContentType);
      res.setHeader('Content-Disposition', `attachment; filename="${image.originalname}"`);
      s3Response.Body.pipe(res);
    } catch (s3Error) {
      console.error('S3 error:', s3Error);
      res.status(500).json({ message: 'Error downloading from S3', error: s3Error.message });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Error retrieving file', error: error.message });
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const images = await Image.find().sort({ uploadDate: -1 });
    
    // Generate presigned URLs for all images
    const imagesWithUrls = await Promise.all(images.map(async (image) => {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: image.s3Key,
        ResponseContentDisposition: `attachment; filename="${image.originalname}"`
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return {
        ...image.toObject(),
        url
      };
    }));

    res.json(imagesWithUrls);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving files', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
