/**
 * @author: Awais Nazeer (ZRR Gujjar)
 * @email: awaisnazeer07@gmail.com
 */

const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

// Process image and extract text using Tesseract OCR
exports.processImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    
    // Process the image with Tesseract.js
    const result = await Tesseract.recognize(
      imagePath,
      'eng', // Language (English)
      { 
        logger: m => console.log(m), // Log progress in console
      }
    );

    // Return extracted text
    return res.status(200).json({
      success: true,
      text: result.data.text,
      confidence: result.data.confidence
    });
  } catch (error) {
    console.error('OCR Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing image',
      error: error.message 
    });
  }
};