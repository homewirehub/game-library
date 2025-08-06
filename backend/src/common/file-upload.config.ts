import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as crypto from 'crypto';

// Allowed file types for game uploads
const ALLOWED_GAME_EXTENSIONS = [
  '.zip', '.rar', '.7z', '.tar.gz', '.tar.bz2',
  '.exe', '.msi', '.deb', '.rpm', '.AppImage',
  '.dmg', '.pkg', '.apk', '.ipa',
  '.iso', '.img', '.bin', '.nrg'
];

// MIME type validation (additional security layer)
const ALLOWED_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-executable',
  'application/x-msdownload',
  'application/vnd.debian.binary-package',
  'application/x-rpm',
  'application/octet-stream',
  'application/x-iso9660-image'
];

export interface UploadConfig {
  maxFileSize: number;
  uploadDir: string;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  virusScanEnabled: boolean;
}

export class FileUploadConfigService {
  private static getUploadConfig(): UploadConfig {
    return {
      maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '2147483648'), // 2GB default
      uploadDir: process.env.UPLOAD_DIR || './uploads/games',
      allowedExtensions: ALLOWED_GAME_EXTENSIONS,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === 'true'
    };
  }

  static createMulterOptions(): MulterOptions {
    const config = this.getUploadConfig();

    // Ensure upload directory exists
    if (!existsSync(config.uploadDir)) {
      mkdirSync(config.uploadDir, { recursive: true });
    }

    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, config.uploadDir);
        },
        filename: (req, file, cb) => {
          // Generate secure filename with timestamp and random hash
          const timestamp = Date.now();
          const randomHash = crypto.randomBytes(8).toString('hex');
          const fileExt = extname(file.originalname).toLowerCase();
          const filename = `${timestamp}-${randomHash}${fileExt}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        const fileExt = extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype.toLowerCase();

        // Check file extension
        if (!config.allowedExtensions.includes(fileExt)) {
          return cb(
            new BadRequestException(
              `File type '${fileExt}' not allowed. Supported types: ${config.allowedExtensions.join(', ')}`
            ),
            false
          );
        }

        // Check MIME type (additional security)
        if (!config.allowedMimeTypes.includes(mimeType)) {
          return cb(
            new BadRequestException(
              `MIME type '${mimeType}' not allowed. File may be corrupted or disguised.`
            ),
            false
          );
        }

        // Check for suspicious filenames
        if (this.isSuspiciousFilename(file.originalname)) {
          return cb(
            new BadRequestException(
              'Filename contains suspicious characters or patterns.'
            ),
            false
          );
        }

        cb(null, true);
      },
      limits: {
        fileSize: config.maxFileSize,
        files: 1, // Only allow single file upload
        fields: 10, // Limit form fields
        fieldNameSize: 100, // Limit field name length
        fieldSize: 1024 * 1024, // Limit field value size to 1MB
      },
    };
  }

  private static isSuspiciousFilename(filename: string): boolean {
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return true;
    }

    // Check for null bytes or other dangerous characters
    if (filename.includes('\x00') || filename.includes('\n') || filename.includes('\r')) {
      return true;
    }

    // Check for extremely long filenames (potential buffer overflow)
    if (filename.length > 255) {
      return true;
    }

    // Check for suspicious extensions (double extensions)
    const suspiciousPatterns = [
      /\.(exe|scr|bat|cmd|com|pif|vbs|js|jar|zip)\.(exe|scr|bat|cmd)$/i,
      /\.(exe|scr|bat|cmd|com|pif|vbs|js|jar)\.(zip|rar|7z)$/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(filename));
  }

  static getConfig(): UploadConfig {
    return this.getUploadConfig();
  }
}
