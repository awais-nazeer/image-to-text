# 📝 Professional OCR Web Application

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</div>

<p align="center">
  A professional-grade OCR application for extracting text from images with advanced features including handwriting recognition and table extraction.
</p>
<div align="center">
  <strong>Developed by:</strong> Awais Nazeer (ZRR Gujjar) | <a href="mailto:awaisnazeer07@gmail.com">awaisnazeer07@gmail.com</a>
</div>

## ✨ Advanced Features

- 🖋️ **Handwriting Recognition**: Optimized algorithms for extracting handwritten text
- 📊 **Table Detection & Extraction**: Recognize tabular data and export as CSV/JSON
- 🌐 **Multi-language Support**: Recognize text in 25+ languages with high accuracy
- 🎚️ **Image Preprocessing**: Enhance image quality for better OCR results
- 🔄 **Batch Processing**: Process multiple images at once to save time
- 📱 **Fully Responsive**: Works on all devices (mobile, tablet, desktop)
- 🧠 **Intelligent Content Detection**: Automatically identifies content types
- 💾 **Multiple Export Options**: Save results as TXT, CSV, or JSON
- 🔍 **Detailed Analysis**: View confidence scores and processing statistics

## 📋 Table of Contents

- [📝 Free OCR Web Application](#-free-ocr-web-application)
  - [✨ Features](#-features)
  - [📋 Table of Contents](#-table-of-contents)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [💻 Usage](#-usage)
  - [🔧 How It Works](#-how-it-works)
  - [🌟 Why Use This Over Paid APIs?](#-why-use-this-over-paid-apis)
  - [📁 Project Structure](#-project-structure)
  - [📚 Technologies Used](#-technologies-used)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/awais-nazeer/image-to-text.git
cd image-to-text
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following content:

```
PORT=3000
NODE_ENV=development
```

4. **Start the development server**

```bash
npm run dev
```

5. **Access the application**

Open your browser and navigate to `http://localhost:3000`

## 💻 Usage

1. **Upload an Image**
   - Click on the upload area or drag and drop an image
   - Select an image from your device containing text you want to extract

2. **Process the Image**
   - Click the "Extract Text" button
   - Wait for the processing to complete (processing time depends on image size and complexity)

3. **View and Use the Results**
   - The extracted text will appear in the result section
   - Use the copy button to copy the text to clipboard
   - Use the download button to save the text as a TXT file

## 🔧 How It Works

1. **Frontend**
   - The user uploads an image through the web interface
   - JavaScript handles the file selection and preview
   - The image is sent to the backend via an AJAX request

2. **Backend**
   - Express.js server receives the image
   - Multer middleware handles file upload and storage
   - The image is processed using Tesseract.js OCR engine
   - Extracted text is returned to the frontend as JSON

3. **OCR Processing**
   - Tesseract.js is a pure JavaScript port of the Tesseract OCR engine
   - It analyzes the image pixel by pixel to identify text patterns
   - The recognized text is extracted with confidence scores
   - Results are optimized for accuracy and readability

## 🌟 Why Use This Over Paid APIs?

- **Cost Efficiency**: No recurring API costs or usage limitations
- **Privacy**: All processing is done locally, no data is sent to third-party servers
- **Customization**: Full control over the OCR process and output formatting
- **No Internet Dependency**: Can be configured to work offline
- **No Rate Limits**: Process as many images as you need without restrictions

## 📁 Project Structure

```
ocr-api/
├── public/                  # Static files
│   ├── css/                 # Stylesheets
│   │   └── styles.css       # Main CSS file
│   ├── js/                  # Client-side JavaScript
│   │   └── script.js        # Main JS file
│   ├── images/              # Static images
│   └── index.html           # Main HTML file
├── src/                     # Server-side code
│   ├── controllers/         # Request handlers
│   │   └── ocrController.js # OCR processing logic
│   ├── routes/              # API routes
│   │   └── ocrRoutes.js     # OCR endpoints
│   └── models/              # Data models (if needed)
├── uploads/                 # Temporary storage for uploaded images
├── server.js                # Main application entry point
├── package.json             # Project dependencies
├── .env                     # Environment variables
└── README.md                # Project documentation
```

## 📚 Technologies Used

- **Node.js**: JavaScript runtime built on Chrome's V8 JavaScript engine.
- **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
- **Tesseract.js**: Pure JavaScript OCR for 100+ Languages.
- **Sharp**: High-performance image processing.
- **Languagedetect**: Language detection library.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.