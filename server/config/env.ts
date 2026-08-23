import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number.parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  upload: {
    maxFileSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/webm',
      'audio/mp4',
      'audio/x-m4a',
      'audio/m4a',
      'audio/aac',
      'video/webm', // Many browser MediaRecorder recordings use video/webm or audio/webm
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/mpeg',
      'video/x-flv',
      'video/x-ms-wmv',
      'video/3gpp'
    ],
    allowedExtensions: [
      '.mp3', '.wav', '.ogg', '.webm', '.m4a', '.mp4', '.aac',
      '.mov', '.avi', '.mpeg', '.mpg', '.flv', '.wmv', '.3gp'
    ]
  }
};
