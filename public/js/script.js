/**
 * @author: Awais Nazeer (ZRR Gujjar)
 * @email: awaisnazeer07@gmail.com
 */

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
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

  // Variables
  let selectedFile = null;

  // Event Listeners
  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  changeBtn.addEventListener('click', () => fileInput.click());
  extractBtn.addEventListener('click', processImage);
  copyBtn.addEventListener('click', copyText);
  downloadBtn.addEventListener('click', downloadText);

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
      fileInput.files = e.dataTransfer.files;
      handleFileSelect();
    }
  });

  // Functions
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

  async function processImage() {
    if (!selectedFile) {
      showNotification('Please select an image first', 'error');
      return;
    }

    // Show loader
    loader.style.display = 'block';
    resultText.value = '';
    resultSection.style.display = 'block';

    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Send request to OCR API
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Display the extracted text
        resultText.value = data.text;
        showNotification(`Text extracted with ${data.confidence.toFixed(2)}% confidence`, 'success');
      } else {
        throw new Error(data.message || 'Failed to extract text');
      }
    } catch (error) {
      console.error('Error:', error);
      resultText.value = `Error: ${error.message || 'Failed to process image'}`;
      showNotification('Failed to extract text. Please try again.', 'error');
    } finally {
      // Hide loader
      loader.style.display = 'none';
    }
  }

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

  function showNotification(message, type = 'info') {
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

  // Add CSS for notifications
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #4a6cf7;
      color: white;
      padding: 12px 25px;
      border-radius: 6px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      transition: top 0.3s ease;
    }
    .notification.show {
      top: 20px;
    }
    .notification.success {
      background-color: #4CAF50;
    }
    .notification.error {
      background-color: #f44336;
    }
  `;
  document.head.appendChild(style);
});