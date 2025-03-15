/**
 * @author: Awais Nazeer (ZRR Gujjar)
 * @email: awaisnazeer07@gmail.com
 */

const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const { createWorker, PSM, OEM } = Tesseract;
const ImageProcessor = require('../utils/imageProcessor');

// Process image and extract text using enhanced Tesseract OCR
exports.processImage = async (req, res) => {
  const processedPaths = [];
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    const options = req.body;
    
    // Get OCR mode and preprocessing method
    const mode = options.mode || 'text'; // text, handwriting, table
    const language = options.language || 'eng';
    const preprocessing = options.preprocessing || 'none';
    
    // Preprocess the image based on the requested method
    let processedImagePath = imagePath;
    
    // Auto detect if it's a table when mode is auto or if table mode is explicitly selected
    let isTable = false;
    if (mode === 'auto' || mode === 'table') {
      isTable = await ImageProcessor.detectTable(imagePath);
      if (isTable && mode === 'auto') {
        console.log('Table detected automatically');
      }
    }
    
    // Different preprocessing based on content type
    if (mode === 'handwriting' || (mode === 'auto' && !isTable)) {
      processedImagePath = await ImageProcessor.optimizeForHandwriting(imagePath);
      processedPaths.push(processedImagePath);
    } else if (preprocessing !== 'none') {
      processedImagePath = await ImageProcessor.preprocess(imagePath, preprocessing);
      processedPaths.push(processedImagePath);
    }
    
    // Create a worker with optimal settings
    const worker = await createWorker({
      logger: m => console.log(m),
      // Use locally cached language data if available
      cachePath: path.join(__dirname, '../../tessdata'),
    });

    // Load language data
    await worker.loadLanguage(language);
    await worker.initialize(language);
    
    // Set appropriate recognition parameters
    let psmMode = PSM.AUTO;
    
    // Configure for specific content types
    switch(mode) {
      case 'handwriting':
        // Optimized for handwriting
        psmMode = PSM.SINGLE_LINE;
        await worker.setParameters({
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:\'"-+/\\!?@#$%^&*()[]{}|<>=',
          tessjs_create_hocr: '1',
          tessjs_create_tsv: '1',
          preserve_interword_spaces: '1',
        });
        break;
      
      case 'table':
      case 'auto': // If auto detected a table
        if (isTable) {
          // Optimized for table structure
          psmMode = PSM.AUTO_OSD;
          await worker.setParameters({
            tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
            tessjs_create_hocr: '1',
            tessjs_create_tsv: '1',
            tessjs_create_box: '1',
            preserve_interword_spaces: '1',
          });
        } else {
          // Default text settings
          psmMode = PSM.AUTO;
          await worker.setParameters({
            tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
            tessjs_create_hocr: '1',
            preserve_interword_spaces: '1',
          });
        }
        break;
      
      default: // Regular text
        psmMode = PSM.AUTO;
        await worker.setParameters({
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
          tessjs_create_hocr: '1',
          preserve_interword_spaces: '1',
        });
    }
    
    // Set the page segmentation mode
    await worker.setParameters({
      tessedit_pageseg_mode: psmMode,
    });
    
    // Process the image
    const { data } = await worker.recognize(processedImagePath);
    
    // Post-process results based on mode
    let result = {
      text: data.text,
      confidence: data.confidence,
      hocr: data.hocr
    };
    
    // Additional processing for tables if detected or explicitly requested
    if ((mode === 'table' || (mode === 'auto' && isTable)) && data.tsv) {
      const tableData = processTableStructure(data.tsv, data.text);
      result.tableData = tableData;
      result.isTable = true;
    }
    
    // Add bounding box data when available
    if (data.words) {
      result.words = data.words;
    }
    
    // Terminate worker
    await worker.terminate();
    
    // Clean up processed images
    await ImageProcessor.cleanupProcessedImages(processedPaths);
    
    // Return enhanced extracted text/data
    return res.status(200).json({
      success: true,
      mode: isTable ? 'table' : mode,
      language: language,
      ...result
    });
  } catch (error) {
    console.error('OCR Error:', error);
    
    // Clean up processed images on error
    await ImageProcessor.cleanupProcessedImages(processedPaths);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing image',
      error: error.message 
    });
  }
};

// Process multiple images with batch support
exports.processBatchImages = async (req, res) => {
  const processedPaths = [];
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const results = [];
    
    // Get processing options
    const mode = req.body.mode || 'text';
    const language = req.body.language || 'eng';
    const preprocessing = req.body.preprocessing || 'none';
    
    // Create a single worker for efficiency
    const worker = await createWorker({
      logger: m => console.log(m),
      cachePath: path.join(__dirname, '../../tessdata'),
    });
    
    // Load language
    await worker.loadLanguage(language);
    await worker.initialize(language);
    
    // Set optimal parameters based on mode
    if (mode === 'handwriting') {
      await worker.setParameters({
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:\'"-+/\\!?@#$%^&*()[]{}|<>=',
        preserve_interword_spaces: '1',
      });
    } else if (mode === 'table') {
      await worker.setParameters({
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
        tessedit_pageseg_mode: PSM.AUTO_OSD,
        tessjs_create_tsv: '1',
        preserve_interword_spaces: '1',
      });
    } else {
      await worker.setParameters({
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: '1',
      });
    }

    // Process each image
    for (const file of req.files) {
      const imagePath = file.path;
      
      // Apply preprocessing based on mode
      let processedImagePath = imagePath;
      if (mode === 'handwriting') {
        processedImagePath = await ImageProcessor.optimizeForHandwriting(imagePath);
        processedPaths.push(processedImagePath);
      } else if (preprocessing !== 'none') {
        processedImagePath = await ImageProcessor.preprocess(imagePath, preprocessing);
        processedPaths.push(processedImagePath);
      }
      
      const { data } = await worker.recognize(processedImagePath);
      
      // Basic table detection for auto mode
      let tableData = null;
      let isTable = false;
      
      if (mode === 'table' || mode === 'auto') {
        isTable = await ImageProcessor.detectTable(imagePath);
        if (isTable && data.tsv) {
          tableData = processTableStructure(data.tsv, data.text);
        }
      }
      
      results.push({
        filename: file.originalname,
        text: data.text,
        confidence: data.confidence,
        tableData: tableData,
        isTable: isTable
      });
    }
    
    // Terminate worker
    await worker.terminate();
    
    // Clean up processed images
    await ImageProcessor.cleanupProcessedImages(processedPaths);
    
    return res.status(200).json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Batch OCR Error:', error);
    
    // Clean up processed images on error
    await ImageProcessor.cleanupProcessedImages(processedPaths);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing batch images',
      error: error.message 
    });
  }
};

// Helper function to process table data from TSV
function processTableStructure(tsv, fullText) {
  if (!tsv) return null;
  
  try {
    // Split TSV by lines
    const lines = tsv.split('\n')
      .filter(line => line.trim().length > 0);
      
    // Skip header row
    const dataRows = lines.slice(1);
    
    // Parse rows into tabular structure
    const tableData = dataRows.map(row => {
      const columns = row.split('\t');
      
      // Extract useful columns
      if (columns.length >= 5) {
        return {
          text: columns[11] || '',  // The actual text content
          confidence: parseFloat(columns[10]) || 0, // The confidence score
          bbox: { // Bounding box coordinates
            x: parseInt(columns[6]) || 0,
            y: parseInt(columns[7]) || 0,
            width: parseInt(columns[8]) || 0,
            height: parseInt(columns[9]) || 0
          }
        };
      }
      return null;
    }).filter(row => row !== null);
    
    // If enough structured cells were found, try to organize them into a table
    if (tableData.length > 0) {
      // Simple table reconstruction
      // This is a basic approach - more sophisticated analysis would be needed for complex tables
      const organizedTable = organizeIntoTable(tableData);
      
      return {
        raw: tableData,
        structured: organizedTable
      };
    }
    
    return { raw: tableData };
  } catch (error) {
    console.error('Error processing table data:', error);
    return null;
  }
}

// Helper function to organize detected cells into a table structure
function organizeIntoTable(cells) {
  // Sort cells by Y position first (rows), then X position (columns)
  cells.sort((a, b) => {
    // Group cells into rows based on Y position (with some tolerance)
    const tolerance = 10;
    if (Math.abs(a.bbox.y - b.bbox.y) <= tolerance) {
      return a.bbox.x - b.bbox.x; // Same row, sort by X position
    }
    return a.bbox.y - b.bbox.y; // Different rows, sort by Y position
  });
  
  // Group cells into rows
  const rows = [];
  let currentRow = [];
  let currentRowY = null;
  const yTolerance = 10; // Tolerance for considering cells in the same row
  
  for (const cell of cells) {
    if (currentRowY === null || Math.abs(cell.bbox.y - currentRowY) <= yTolerance) {
      // Same row
      currentRow.push(cell);
      if (currentRowY === null) {
        currentRowY = cell.bbox.y;
      }
    } else {
      // New row
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [cell];
      currentRowY = cell.bbox.y;
    }
  }
  
  // Add the last row
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  // Convert to a 2D array of text values
  return rows.map(row => row.map(cell => cell.text));
}