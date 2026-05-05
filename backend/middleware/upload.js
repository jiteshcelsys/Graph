const multer = require('multer');
const path = require('path');
const { createError } = require('./errorHandler');

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50');
const ALLOWED_EXTS = ['.csv', '.xlsx', '.xls', '.sql'];

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR || './uploads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTS.includes(ext)) cb(null, true);
  else cb(createError('Only CSV, Excel, and SQL files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = upload;
