const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'events');

// Ensure upload directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext === '.jpg' || ext === '.jpeg' || ext === '.png' ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const fileFilter = function (_req, file, cb) {
  const allowedMime = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedMime.includes(file.mimetype)) {
    // Don't hard-fail multer globally; let the route respond with a clear message.
    // Multer will set req.file to undefined when cb(null, false) is used.
    _req.fileValidationError = 'Only JPG/JPEG/PNG images are allowed';
    return cb(null, false);
  }
  cb(null, true);
};

// <2MB limit as requested
const uploadEventImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

module.exports = uploadEventImage;

