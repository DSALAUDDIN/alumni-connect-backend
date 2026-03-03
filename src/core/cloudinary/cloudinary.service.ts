import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export type CloudinaryFolder =
    | 'avatars'
    | 'feed'
    | 'marketplace'
    | 'events'
    | 'projects';

export interface UploadResult {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format: string;
    bytes: number;
}

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });
    }

    /**
     * Upload a single file buffer to Cloudinary.
     * @param buffer  The file buffer from Multer
     * @param folder  Cloudinary folder (avatars | feed | marketplace | ...)
     * @param publicId Optional custom public ID (e.g., slug or user ID)
     */
    async uploadBuffer(
        buffer: Buffer,
        folder: CloudinaryFolder,
        publicId?: string,
    ): Promise<UploadResult> {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                folder: `alumni_connect/${folder}`,
                resource_type: 'image' as const,
                quality: 'auto',
                fetch_format: 'auto',
                ...(publicId && { public_id: publicId, overwrite: true }),
            };

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result: UploadApiResponse | undefined) => {
                    if (error || !result) {
                        this.logger.error(`Cloudinary upload failed: ${error?.message}`);
                        reject(new BadRequestException('File upload failed'));
                    } else {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                            width: result.width,
                            height: result.height,
                            format: result.format,
                            bytes: result.bytes,
                        });
                    }
                },
            );

            // Pipe buffer into the upload stream
            const readable = new Readable();
            readable.push(buffer);
            readable.push(null);
            readable.pipe(uploadStream);
        });
    }

    /**
     * Upload multiple file buffers (e.g., marketplace / feed media).
     */
    async uploadMany(
        files: Express.Multer.File[],
        folder: CloudinaryFolder,
    ): Promise<UploadResult[]> {
        return Promise.all(files.map((f) => this.uploadBuffer(f.buffer, folder)));
    }

    /**
     * Delete a file from Cloudinary by its public_id.
     */
    async delete(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
            this.logger.log(`Deleted Cloudinary asset: ${publicId}`);
        } catch (error) {
            this.logger.error(`Failed to delete asset ${publicId}: ${error.message}`);
        }
    }

    /**
     * Generate an optimised, resized URL without re-uploading.
     * Useful for thumbnails on the fly.
     */
    getTransformedUrl(publicId: string, width: number, height: number): string {
        return cloudinary.url(publicId, {
            width,
            height,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            fetch_format: 'auto',
            secure: true,
        });
    }
}
