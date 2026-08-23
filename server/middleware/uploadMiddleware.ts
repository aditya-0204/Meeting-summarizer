import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from '../config/env.js';

// Setup uploads storage folder
const uploadsDir = process.env.VERCEL === '1'
  ? path.join(os.tmpdir(), 'meeting-summarizer-uploads')
  : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedExt = path.extname(file.originalname).toLowerCase() || '.mp3';
    cb(null, `meeting-${uniqueSuffix}${sanitizedExt}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSizeBytes
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = config.upload.allowedExtensions.includes(ext);
    const isAllowedMime =
      config.upload.allowedMimeTypes.includes(file.mimetype) ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('video/');

    if (isAllowedExt || isAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format "${file.mimetype}". Supported formats: MP3, WAV, M4A, WEBM, OGG, AAC.`));
    }
  }
});
