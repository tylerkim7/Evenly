const express = require('express');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

// using mutler, a npm package for middleware functionality and uploading files
const upload = multer({ 
    storage: multer.memoryStorage()
});

app.post ('/receipt', upload.single('receiptImg'), async(req, res) => {
try {
    res.json({
      success: true,
      message: 'Image received successfully',
      imageInfo: {
        size: req.file.size,
        type: req.file.mimetype,
        originalName: req.file.originalname
      }
    });
} catch (error) {
    console.error('Error:', error);
}});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});