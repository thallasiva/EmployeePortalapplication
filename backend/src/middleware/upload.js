const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { upload: uploadConfig } = require('../config/env');

const uploadDir = path.resolve(process.cwd(), uploadConfig.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: uploadConfig.maxMb * 1024 * 1024 },
});

module.exports = upload;
