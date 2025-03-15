/**
 * @author: Awais Nazeer (ZRR Gujjar)
 * @email: awaisnazeer07@gmail.com
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements - Core UI
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const imagePreview = document.getElementById('image-preview');
  const previewImage = document.getElementById('preview-image');
  const fileName = document.getElementById('file-name');
  const changeBtn = document.getElementById('change-btn');
  const extractBtn = document.getElementById('extract-btn');
  const resultSection = document.getElementById('result-section');
  const resultText = document.getElementById('result-text');
  const copyBtn = document.getElementById('copy-btn');
  const downloadBtn = document.getElementById('download-btn');
  const loader = document.getElementById('loader');
  const progressBar = document.getElementById('progress-bar');
  const processingStatus = document.getElementById('processing-status');

  // DOM Elements - Advanced Options
  const ocrModeSelect = document.getElementById('ocr-mode');
  const languageSelect = document.getElementById('language');
  const preprocessingSelect = document.getElementById('preprocessing');
  const batchModeToggle = document.getElementById('batch-mode');
  const batchUploadContainer = document.getElementById('batch-upload-container');
  const batchFileInput = document.getElementById('batch-file-input');
  const batchBrowseBtn = document.getElementById('batch-browse-btn');
  const batchFilesList = document.getElementById('batch-files-list');
  
  // DOM Elements - Table Actions
  const downloadCsvBtn = document.getElementById('download-csv-btn');
  const downloadJsonBtn = document.getElementById('download-json-btn');
  
  // DOM Elements - Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const tableContainer = document.getElementById('table-container');
  const hocrContent = document.getElementById('hocr-content');
  
  // DOM Elements - Stats
  const statMode = document.getElementById('stat-mode');
  const statLanguage = document.getElementById('stat-language');
  const statConfidence = document.getElementById('stat-confidence');
  const statTime = document.getElementById('stat-time');
  const statWords = document.getElementById('stat-words');
  const statChars = document.getElementById('stat-chars');
  
  // Variables
  let selectedFile = null;
  let batchFiles = [];
  let processingTime = 0;
  let processingTimer = null;
  let tableData = null;
  let currentLanguages = [];
  
  // Initialize the application
  init();

  // Event Listeners - File Upload
  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  changeBtn.addEventListener('click', () => fileInput.click());
  extractBtn.addEventListener('click', processImage);
  
  // Event Listeners - Batch Mode
  batchModeToggle.addEventListener('change', toggleBatchMode);
  batchBrowseBtn.addEventListener('click', () => batchFileInput.click());
  batchFileInput.addEventListener('change', handleBatchFileSelect);
  
  // Event Listeners - Results Actions
  copyBtn.addEventListener('click', copyText);
  downloadBtn.addEventListener('click', downloadText);
  downloadCsvBtn.addEventListener('click', downloadCsv);
  downloadJsonBtn.addEventListener('click', downloadJson);
  
  // Event Listeners - Tabs
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabName = button.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // Drag and drop functionality
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('active');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('active');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('active');
    
    if (e.dataTransfer.files.length) {
      if (batchModeToggle.checked && e.dataTransfer.files.length > 1) {
        batchFileInput.files = e.dataTransfer.files;
        handleBatchFileSelect();
      } else {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
      }
    }
  });

  // Initialize app
  async function init() {
    // Load available languages
    try {
      const response = await fetch('/api/languages');
      const data = await response.json();
      
      if (data.success && data.languages) {
        currentLanguages = data.languages;
        // Clear and update language select options
        languageSelect.innerHTML = '';
        data.languages.forEach(lang => {
          const option = document.createElement('option');
          option.value = lang.code;
          option.textContent = lang.name;
          languageSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
    
    // Disable extract button initially
    extractBtn.disabled = true;
  }

  // Functions - File Handling
  function handleFileSelect() {
    if (fileInput.files.length) {
      selectedFile = fileInput.files[0];
      
      // Validate file is an image
      if (!selectedFile.type.match('image.*')) {
        showNotification('Please select an image file (JPEG, PNG, etc.)', 'error');
        return;
      }

      // Update UI to show preview
      uploadArea.style.display = 'none';
      imagePreview.style.display = 'block';
      
      // Set file name
      fileName.textContent = selectedFile.name;
      
      // Show image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
      };
      reader.readAsDataURL(selectedFile);
      
      // Enable extract button
      extractBtn.disabled = false;
    }
  }
  
  function handleBatchFileSelect() {
    if (batchFileInput.files.length) {
      batchFiles = Array.from(batchFileInput.files);
      
      // Validate all files are images
      const invalidFiles = batchFiles.filter(file => !file.type.match('image.*'));
      if (invalidFiles.length > 0) {
        showNotification(`${invalidFiles.length} invalid files were removed`, 'warning');
        batchFiles = batchFiles.filter(file => file.type.match('image.*'));
      }
      
      // Limit to 10 files
      if (batchFiles.length > 10) {
        showNotification('Maximum 10 files allowed. Extra files were removed.', 'warning');
        batchFiles = batchFiles.slice(0, 10);
      }
      
      // Update UI with selected files
      updateBatchFilesList();
      
      // Enable extract button if files were selected
      extractBtn.disabled = batchFiles.length === 0;
    }
  }
  
  function updateBatchFilesList() {
    batchFilesList.innerHTML = '';
    
    batchFiles.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'batch-file-item';
      
      const fileName = document.createElement('span');
      fileName.className = 'batch-file-name';
      fileName.textContent = file.name;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'batch-file-remove';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.addEventListener('click', () => removeBatchFile(index));
      
      fileItem.appendChild(fileName);
      fileItem.appendChild(removeBtn);
      batchFilesList.appendChild(fileItem);
    });
  }
  
  function removeBatchFile(index) {
    batchFiles.splice(index, 1);
    updateBatchFilesList();
    extractBtn.disabled = batchFiles.length === 0;
  }
  
  function toggleBatchMode() {
    if (batchModeToggle.checked) {
      batchUploadContainer.style.display = 'block';
      uploadArea.style.display = 'block';
      imagePreview.style.display = 'none';
      extractBtn.disabled = batchFiles.length === 0;
    } else {
      batchUploadContainer.style.display = 'none';
      extractBtn.disabled = !selectedFile;
      if (selectedFile) {
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
      } else {
        uploadArea.style.display = 'block';
      }
    }
  }

  // Functions - OCR Processing
  async function processImage() {
    if (batchModeToggle.checked) {
      await processBatchImages();
    } else {
      await processSingleImage();
    }
  }
  
  async function processSingleImage() {
    if (!selectedFile) {
      showNotification('Please select an image first', 'error');
      return;
    }

    // Show loader and reset progress
    showLoader();
    resetResults();
    
    // Start processing timer
    startProcessingTimer();

    try {
      // Get current settings
      const mode = ocrModeSelect.value;
      const language = languageSelect.value;
      const preprocessing = preprocessingSelect.value;
      
      // Update processing status
      updateProcessingStatus('Uploading image...');
      updateProgress(10);
      
      // Create FormData and append file and options
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('mode', mode);
      formData.append('language', language);
      formData.append('preprocessing', preprocessing);

      // Send request to OCR API
      updateProcessingStatus('Processing with OCR engine...');
      updateProgress(30);
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      });

      updateProcessingStatus('Analyzing results...');
      updateProgress(80);
      
      const data = await response.json();

      if (data.success) {
        // Save table data if present
        if (data.tableData) {
          tableData = data.tableData;
          // Show table action buttons
          document.querySelectorAll('.table-action').forEach(btn => {
            btn.style.display = 'inline-flex';
          });
          // Render table in the table tab
          renderTable(tableData);
        } else {
          tableData = null;
          document.querySelectorAll('.table-action').forEach(btn => {
            btn.style.display = 'none';
          });
        }
        
        // Display the extracted text
        resultText.value = data.text || '';
        
        // Display hOCR if available
        if (data.hocr) {
          hocrContent.innerHTML = `<pre>${escapeHtml(data.hocr)}</pre>`;
        } else {
          hocrContent.innerHTML = '<p class="tab-placeholder">No hOCR data available for this image.</p>';
        }
        
        // Update stats
        const languageName = currentLanguages.find(l => l.code === data.language)?.name || data.language;
        const modeName = getModeName(data.mode);
        
        statMode.textContent = modeName;
        statLanguage.textContent = languageName;
        statConfidence.textContent = data.confidence ? `${data.confidence.toFixed(2)}%` : 'N/A';
        
        const wordCount = data.text ? data.text.split(/\s+/).filter(Boolean).length : 0;
        const charCount = data.text ? data.text.length : 0;
        
        statWords.textContent = wordCount;
        statChars.textContent = charCount;
        
        // Show success notification
        showNotification(`Text extracted successfully`, 'success');
      } else {
        throw new Error(data.message || 'Failed to extract text');
      }
    } catch (error) {
      console.error('Error:', error);
      resultText.value = `Error: ${error.message || 'Failed to process image'}`;
      showNotification('Failed to extract text. Please try again.', 'error');
    } finally {
      // Stop processing timer and hide loader
      stopProcessingTimer();
      hideLoader();
      updateProgress(100);
    }
  }
  
  async function processBatchImages() {
    if (batchFiles.length === 0) {
      showNotification('Please select at least one image', 'error');
      return;
    }
    
    // Show loader and reset progress
    showLoader();
    resetResults();
    
    // Start processing timer
    startProcessingTimer();
    
    try {
      // Get current settings
      const mode = ocrModeSelect.value;
      const language = languageSelect.value;
      const preprocessing = preprocessingSelect.value;
      
      // Update processing status
      updateProcessingStatus('Uploading batch images...');
      updateProgress(10);
      
      // Create FormData
      const formData = new FormData();
      batchFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('mode', mode);
      formData.append('language', language);
      formData.append('preprocessing', preprocessing);
      
      // Send request to batch OCR API
      updateProcessingStatus(`Processing ${batchFiles.length} images...`);
      updateProgress(30);
      
      const response = await fetch('/api/batch-ocr', {
        method: 'POST',
        body: formData
      });
      
      updateProcessingStatus('Analyzing batch results...');
      updateProgress(80);
      
      const data = await response.json();
      
      if (data.success) {
        // Combine all texts with file information
        const combinedText = data.results.map(result => 
          `=== ${result.filename} ===\n${result.text}\n\n`
        ).join('');
        
        // Display the combined text
        resultText.value = combinedText;
        
        // Update stats
        const languageName = currentLanguages.find(l => l.code === language)?.name || language;
        const modeName = getModeName(mode);
        
        statMode.textContent = `Batch (${modeName})`;
        statLanguage.textContent = languageName;
        
        // Calculate average confidence
        const avgConfidence = data.results.reduce((sum, item) => sum + (item.confidence || 0), 0) / data.results.length;
        statConfidence.textContent = isNaN(avgConfidence) ? 'N/A' : `${avgConfidence.toFixed(2)}%`;
        
        // Count words and chars
        const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
        const charCount = combinedText.length;
        
        statWords.textContent = wordCount;
        statChars.textContent = charCount;
        
        showNotification(`Processed ${data.results.length} images successfully`, 'success');
      } else {
        throw new Error(data.message || 'Failed to process batch images');
      }
    } catch (error) {
      console.error('Batch Error:', error);
      resultText.value = `Error: ${error.message || 'Failed to process batch images'}`;
      showNotification('Failed to process batch. Please try again.', 'error');
    } finally {
      // Stop processing timer and hide loader
      stopProcessingTimer();
      hideLoader();
      updateProgress(100);
    }
  }
  
  // Functions - UI Helpers
  function showLoader() {
    resultSection.style.display = 'block';
    loader.style.display = 'block';
  }
  
  function hideLoader() {
    loader.style.display = 'none';
  }
  
  function resetResults() {
    resultText.value = '';
    hocrContent.innerHTML = '<p class="tab-placeholder">HTML output will appear here.</p>';
    tableContainer.innerHTML = '<p class="tab-placeholder">Table data will be displayed here if detected.</p>';
    tableData = null;
    
    // Reset stats
    statMode.textContent = getModeName(ocrModeSelect.value);
    statLanguage.textContent = currentLanguages.find(l => l.code === languageSelect.value)?.name || languageSelect.value;
    statConfidence.textContent = '0%';
    statTime.textContent = '0s';
    statWords.textContent = '0';
    statChars.textContent = '0';
    
    // Hide table action buttons
    document.querySelectorAll('.table-action').forEach(btn => {
      btn.style.display = 'none';
    });
  }
  
  function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
  }
  
  function updateProcessingStatus(message) {
    processingStatus.textContent = message;
  }
  
  function startProcessingTimer() {
    stopProcessingTimer();
    processingTime = 0;
    processingTimer = setInterval(() => {
      processingTime++;
      statTime.textContent = `${processingTime}s`;
    }, 1000);
  }
  
  function stopProcessingTimer() {
    if (processingTimer) {
      clearInterval(processingTimer);
      processingTimer = null;
    }
  }
  
  function getModeName(code) {
    const modes = {
      'text': 'Regular Text',
      'handwriting': 'Handwriting',
      'table': 'Table Data'
    };
    return modes[code] || code;
  }
  
  function renderTable(tableData) {
    if (!tableData || !tableData.structured || tableData.structured.length === 0) {
      tableContainer.innerHTML = '<p class="tab-placeholder">No table structure was detected in this image.</p>';
      return;
    }
    
    // Create table element
    const table = document.createElement('table');
    table.className = 'ocr-table';
    
    // Create table rows and cells
    tableData.structured.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      
      row.forEach((cell, cellIndex) => {
        const cellEl = rowIndex === 0 ? document.createElement('th') : document.createElement('td');
        cellEl.textContent = cell || '';
        tr.appendChild(cellEl);
      });
      
      table.appendChild(tr);
    });
    
    // Add to container
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
  }
  
  // Functions - Text Actions
  function copyText() {
    if (!resultText.value) {
      showNotification('No text to copy', 'error');
      return;
    }

    resultText.select();
    document.execCommand('copy');
    showNotification('Text copied to clipboard', 'success');
  }

  function downloadText() {
    if (!resultText.value) {
      showNotification('No text to download', 'error');
      return;
    }

    const blob = new Blob([resultText.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Text downloaded as TXT file', 'success');
  }
  
  function downloadCsv() {
    if (!tableData || !tableData.structured || tableData.structured.length === 0) {
      showNotification('No table data available to download', 'error');
      return;
    }
    
    // Convert table data to CSV
    const csvContent = tableData.structured.map(row => {
      return row.map(cell => {
        // Escape quotes and wrap in quotes if needed
        const escaped = cell ? cell.replace(/"/g, '""') : '';
        return `"${escaped}"`;
      }).join(',');
    }).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Table downloaded as CSV file', 'success');
  }
  
  function downloadJson() {
    if (!tableData) {
      showNotification('No table data available to download', 'error');
      return;
    }
    
    // Create and download file
    const blob = new Blob([JSON.stringify(tableData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Table data downloaded as JSON file', 'success');
  }

  // Helper function to show notifications
  function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
      notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to body
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});