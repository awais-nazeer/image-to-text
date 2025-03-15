/**
 * @author: Awais Nazeer (ZRR Gujjar)
 * @email: awaisnazeer07@gmail.com
 * 
 * Script to download Tesseract.js language data for better OCR performance
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { writeFile, mkdir } = require('fs').promises;

// Base URL for Tesseract.js language data
const LANG_BASE_URL = 'https://raw.githubusercontent.com/naptha/tessdata/master/4.0.0/';

// Languages to download
const LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'deu', name: 'German' },
  { code: 'fra', name: 'French' },
  { code: 'spa', name: 'Spanish' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'chi_tra', name: 'Chinese (Traditional)' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
  { code: 'ara', name: 'Arabic' },
  { code: 'hin', name: 'Hindi' },
  { code: 'rus', name: 'Russian' },
  { code: 'osd', name: 'Script/Orientation Detection' }
];

// Directory to save language data
const LANG_DIR = path.join(__dirname, '..', 'tessdata');

// Create directory if it doesn't exist
async function ensureDirectory() {
  try {
    await mkdir(LANG_DIR, { recursive: true });
    console.log(`Directory created or already exists: ${LANG_DIR}`);
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
    throw error;
  }
}

// Download a single language file
async function downloadLanguage(lang) {
  const url = `${LANG_BASE_URL}${lang.code}.traineddata`;
  const filePath = path.join(LANG_DIR, `${lang.code}.traineddata`);
  
  console.log(`Downloading ${lang.name} (${lang.code}) from ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download ${lang.code}: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    await writeFile(filePath, buffer);
    
    console.log(`✅ Successfully downloaded ${lang.name} (${lang.code})`);
    return { lang, success: true };
  } catch (error) {
    console.error(`❌ Error downloading ${lang.code}: ${error.message}`);
    return { lang, success: false, error: error.message };
  }
}

// Main function to download all languages
async function downloadAllLanguages() {
  console.log('=== Tesseract.js Language Downloader ===');
  console.log(`Downloading ${LANGUAGES.length} languages to ${LANG_DIR}`);
  
  try {
    await ensureDirectory();
    
    const results = await Promise.all(
      LANGUAGES.map(lang => downloadLanguage(lang))
    );
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n=== Download Summary ===`);
    console.log(`Total: ${LANGUAGES.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${LANGUAGES.length - successful}`);
    
    if (successful > 0) {
      console.log(`\nLanguages are ready to use!`);
    }
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the download
downloadAllLanguages().catch(console.error); 