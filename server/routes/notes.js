const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// In Vercel serverless, the local directory is read-only; use os.tmpdir()
const isVercel = Boolean(process.env.VERCEL);
const uploadDir = isVercel
  ? path.join(os.tmpdir(), 'smart-campus-uploads')
  : path.join(__dirname, '..', '..', 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Notes Route] Storage directory notice:', e.message);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// Allow PDF, doc, docx, txt, pptx up to 25MB
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.pptx', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word documents, text, and slide files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
  fileFilter: fileFilter
});

/**
 * POST /api/notes/upload
 * Accepts multipart/form-data with file and metadata (subject, unit, title)
 */
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided for upload.' });
  }

  const { title, subject, unit, code } = req.body;

  const noteRecord = {
    id: `NOTE-UPL-${Date.now().toString().slice(-4)}`,
    title: title || req.file.originalname,
    subject: subject || 'General / Interdisciplinary',
    code: code || 'GEN',
    unit: unit || 'Uploaded Material',
    fileName: req.file.originalname,
    storedFileName: req.file.filename,
    uploadDate: new Date().toISOString().split('T')[0],
    fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
    uploadedBy: 'Student Upload (You)',
    summary: `Student-uploaded study resource for ${subject || 'General'}.`,
    downloadUrl: `/uploads/${req.file.filename}`
  };

  res.json({
    success: true,
    message: 'File uploaded successfully!',
    note: noteRecord
  });
});

module.exports = router;
