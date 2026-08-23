import fs from 'fs';
import path from 'path';

export class StorageService {
  public static async getFileAsBase64(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found at path: ${filePath}`);
    }
    const buffer = await fs.promises.readFile(filePath);
    return buffer.toString('base64');
  }

  public static async getFileBuffer(filePath: string): Promise<Buffer> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found at path: ${filePath}`);
    }
    return fs.promises.readFile(filePath);
  }

  public static async deleteFile(filePath?: string): Promise<boolean> {
    if (!filePath) return false;
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    } catch (err) {
      console.error(`Failed to delete file at ${filePath}:`, err);
    }
    return false;
  }

  public static fileExists(filePath?: string): boolean {
    if (!filePath) return false;
    return fs.existsSync(filePath);
  }

  public static getMimeType(filePath: string, fallbackMime = 'audio/mp3'): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.mp3':
        return 'audio/mp3';
      case '.wav':
        return 'audio/wav';
      case '.ogg':
        return 'audio/ogg';
      case '.webm':
        return 'audio/webm';
      case '.m4a':
      case '.mp4':
        return 'audio/mp4';
      case '.mov':
        return 'video/quicktime';
      case '.avi':
        return 'video/x-msvideo';
      case '.mpeg':
      case '.mpg':
        return 'video/mpeg';
      case '.flv':
        return 'video/x-flv';
      case '.wmv':
        return 'video/x-ms-wmv';
      case '.3gp':
        return 'video/3gpp';
      case '.aac':
        return 'audio/aac';
      default:
        return fallbackMime;
    }
  }
}
