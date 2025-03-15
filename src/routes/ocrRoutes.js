/**
 * @author: Awais Nazeer (ZRR Gujjar)
 * @email: awaisnazeer07@gmail.com
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ocrController = require('../controllers/ocrController');

// Configure storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

// Initialize multer
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit for high-resolution images
  },
  fileFilter: fileFilter
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Create tessdata directory for language data if it doesn't exist
const tessdataPath = path.join(__dirname, '../../tessdata');
if (!fs.existsSync(tessdataPath)) {
  fs.mkdirSync(tessdataPath);
}

// Single image OCR route with advanced options
router.post('/ocr', upload.single('image'), ocrController.processImage);

// Batch processing route - handle multiple images
router.post('/batch-ocr', upload.array('images', 10), ocrController.processBatchImages);

// API endpoint to get available languages
router.get('/languages', (req, res) => {
  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'deu', name: 'German' },
    { code: 'fra', name: 'French' },
    { code: 'spa', name: 'Spanish' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'chi_tra', name: 'Chinese (Traditional)' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
    { code: 'rus', name: 'Russian' },
    { code: 'ben', name: 'Bengali' },
    { code: 'tur', name: 'Turkish' },
    { code: 'tha', name: 'Thai' },
    { code: 'swe', name: 'Swedish' },
    { code: 'nor', name: 'Norwegian' },
    { code: 'dan', name: 'Danish' },
    { code: 'fin', name: 'Finnish' },
    { code: 'pol', name: 'Polish' },
    { code: 'ukr', name: 'Ukrainian' },
    { code: 'ell', name: 'Greek' },
    { code: 'heb', name: 'Hebrew' },
    { code: 'osd', name: 'Orientation and Script Detection' }
  ];
  
  res.json({ success: true, languages });
});

// API endpoint to get OCR modes
router.get('/modes', (req, res) => {
  const modes = [
    { 
      code: 'text', 
      name: 'Regular Text', 
      description: 'Best for printed text in documents, books, articles, etc.' 
    },
    { 
      code: 'handwriting', 
      name: 'Handwriting', 
      description: 'Optimized for handwritten text recognition' 
    },
    { 
      code: 'table', 
      name: 'Table Detection', 
      description: 'Detects and extracts tabular data from images' 
    }
  ];
  
  res.json({ success: true, modes });
});

module.exports = router; 