import path from 'path';
import { config } from '../config/env.js';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  statusCode?: number;
}

export class MeetingValidator {
  public static validateAudioFile(file?: Express.Multer.File): ValidationResult {
    if (!file) {
      return {
        isValid: false,
        error: 'No audio file provided. Please upload an audio file.',
        statusCode: 400
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: 'Uploaded file is empty (0 bytes).',
        statusCode: 400
      };
    }

    if (file.size > config.upload.maxFileSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds the 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB provided).`,
        statusCode: 413
      };
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = config.upload.allowedExtensions.includes(fileExt);
    const isAllowedMime = config.upload.allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/');

    if (!isAllowedExt && !isAllowedMime) {
      return {
        isValid: false,
        error: `Unsupported audio format "${file.mimetype}" (${fileExt}). Supported formats: MP3, WAV, M4A, WEBM, OGG, AAC.`,
        statusCode: 422
      };
    }

    return { isValid: true };
  }

  public static validateMeetingTitle(title?: string): string {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return 'Untitled Meeting ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return title.trim().slice(0, 150);
  }

  public static validateActionItemUpdate(status?: string, owner?: string): ValidationResult {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return {
        isValid: false,
        error: `Invalid status "${status}". Allowed values: ${validStatuses.join(', ')}`,
        statusCode: 400
      };
    }

    if (owner !== undefined && typeof owner === 'string' && owner.length > 100) {
      return {
        isValid: false,
        error: 'Owner name must be less than 100 characters.',
        statusCode: 400
      };
    }

    return { isValid: true };
  }
}
