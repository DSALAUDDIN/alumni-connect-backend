import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

/** Max file size per upload (5 MB) */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types */
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Single-image Multer config (avatar, event cover, etc.)
 */
export const singleImageMulterOptions = {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
            cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        } else {
            cb(null, true);
        }
    },
};

/**
 * Multi-image Multer config (feed posts, marketplace items)
 */
export const multiImageMulterOptions = {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 5 },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
            cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        } else {
            cb(null, true);
        }
    },
};
