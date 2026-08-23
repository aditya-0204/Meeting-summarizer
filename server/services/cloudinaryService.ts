import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

const isConfigured = Boolean(
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

export class CloudinaryService {
  public static isConfigured(): boolean {
    return isConfigured;
  }

  public static async uploadVideo(
    filePath: string,
    meetingId: string
  ): Promise<CloudinaryUploadResult | null> {
    if (!isConfigured) return null;

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'meeting-summarizer',
      public_id: meetingId,
      overwrite: false
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id
    };
  }

  public static async deleteVideo(publicId?: string): Promise<void> {
    if (!isConfigured || !publicId) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  }
}
