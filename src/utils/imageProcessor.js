/**
 * @author: Awais Nazeer (ZRR Gujjar)
 * @email: awaisnazeer07@gmail.com
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Image preprocessing utility for improving OCR accuracy
 */
class ImageProcessor {
  /**
   * Preprocess an image with various techniques to improve OCR accuracy
   * @param {string} inputPath - Path to the input image
   * @param {string} method - Preprocessing method ('grayscale', 'binarize', 'contrast', 'none')
   * @returns {Promise<string>} - Path to the processed image
   */
  static async preprocess(inputPath, method = 'none') {
    try {
      // If no preprocessing needed, return original path
      if (method === 'none') {
        return inputPath;
      }
      
      // Create output filename
      const parsedPath = path.parse(inputPath);
      const outputPath = path.join(
        parsedPath.dir,
        `${parsedPath.name}_processed${parsedPath.ext}`
      );
      
      // Get appropriate preprocessing method
      let processedImage;
      
      switch (method) {
        case 'grayscale':
          processedImage = await this.convertToGrayscale(inputPath);
          break;
        case 'binarize':
          processedImage = await this.binarize(inputPath);
          break;
        case 'contrast':
          processedImage = await this.enhanceContrast(inputPath);
          break;
        default:
          return inputPath;
      }
      
      // Save processed image
      await processedImage.toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      // Return original image if preprocessing fails
      return inputPath;
    }
  }
  
  /**
   * Convert image to grayscale
   * @param {string} inputPath - Path to the input image
   * @returns {Promise<Sharp>} - Sharp instance with the processed image
   */
  static async convertToGrayscale(inputPath) {
    return sharp(inputPath).grayscale();
  }
  
  /**
   * Binarize the image (convert to black and white)
   * @param {string} inputPath - Path to the input image
   * @returns {Promise<Sharp>} - Sharp instance with the processed image
   */
  static async binarize(inputPath) {
    return sharp(inputPath)
      .grayscale()
      .threshold(128); // Default threshold value
  }
  
  /**
   * Enhance image contrast
   * @param {string} inputPath - Path to the input image
   * @returns {Promise<Sharp>} - Sharp instance with the processed image
   */
  static async enhanceContrast(inputPath) {
    return sharp(inputPath)
      .grayscale()
      .normalize() // Stretch histogram
      .modulate({
        brightness: 1.1, // Slightly increase brightness
        saturation: 1.2  // Slightly increase saturation
      });
  }
  
  /**
   * Detect if an image contains a table
   * This is a simplified approach - for production, consider using ML-based solutions
   * @param {string} inputPath - Path to the input image 
   * @returns {Promise<boolean>} - Whether the image likely contains a table
   */
  static async detectTable(inputPath) {
    try {
      // Basic approach using edge detection to find horizontal and vertical lines
      // Convert to grayscale
      const grayscale = await this.convertToGrayscale(inputPath);
      
      // Edge detection
      const edgeImage = await grayscale
        .sharpen(5, 1, 3)       // Enhance edges
        .threshold(120);        // Threshold to binary
      
      // Count strong horizontal and vertical lines
      // This is just a simple heuristic - real table detection would use more sophisticated methods
      const metadata = await edgeImage.stats();
      
      // If there's a high proportion of white pixels, might be a table
      // This is a very simplistic approach
      const whitePixelRatio = metadata.channels[0].mean / 255;
      
      return whitePixelRatio > 0.1 && whitePixelRatio < 0.5;
    } catch (error) {
      console.error('Error detecting table:', error);
      return false;
    }
  }
  
  /**
   * Optimize an image for handwriting recognition
   * @param {string} inputPath - Path to the input image
   * @returns {Promise<string>} - Path to the processed image
   */
  static async optimizeForHandwriting(inputPath) {
    try {
      // Create output filename
      const parsedPath = path.parse(inputPath);
      const outputPath = path.join(
        parsedPath.dir,
        `${parsedPath.name}_handwriting${parsedPath.ext}`
      );
      
      // Process the image - enhance contrast and denoise
      await sharp(inputPath)
        .grayscale()
        .normalize()
        .median(1)              // Light noise reduction
        .gamma(1.2)             // Enhance contrast in mid-tones
        .modulate({
          brightness: 1.05,     // Slightly brighten
          saturation: 0.8       // Reduce saturation
        })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error optimizing for handwriting:', error);
      return inputPath;
    }
  }
  
  /**
   * Cleanup temporary processed images
   * @param {string[]} imagePaths - Paths to processed images to clean up
   */
  static async cleanupProcessedImages(imagePaths) {
    try {
      for (const imagePath of imagePaths) {
        if (imagePath.includes('_processed') || 
            imagePath.includes('_handwriting')) {
          await fs.unlink(imagePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up images:', error);
    }
  }
}

module.exports = ImageProcessor; 