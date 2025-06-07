const express = require('express');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ 
    storage: multer.memoryStorage()
});

app.post ('/receipt', upload.single('receiptImg'), async(req, res) => {
try {
    console.log('Image Received:')
    res.json({
      success: true,
      message: 'Image processed successfully',
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