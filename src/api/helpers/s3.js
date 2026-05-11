import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config.js';

let configured = false;

async function ensureConfigured() {
  if (configured) return;
  const cloudinaryConfig = await config.cloudinary;
  cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    secure: true,
  });
  configured = true;
}

function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

// Multer uses memoryStorage so buffers are available for Cloudinary upload
const storage = multer.memoryStorage();

export const UploadS3 = (_options) => {
  return multer({ storage });
};

export async function S3ExtractMeta(files) {
  await ensureConfigured();
  const result = {};
  for (const key in files) {
    const FILE = [];
    for (const file of files[key]) {
      const cloudResult = await uploadToCloudinary(file.buffer, key);
      FILE.push({
        contentType: file.mimetype,
        key: file.originalname,
        path: cloudResult.public_id,
        url: cloudResult.secure_url,
        sizeInMegaByte: file.size,
      });
    }
    result[key] = FILE;
  }
  return result;
}

export async function S3DeleteFiles({ files }) {
  await ensureConfigured();
  for (const key in files) {
    for (const file of files[key]) {
      if (file.path) {
        await cloudinary.uploader.destroy(file.path, { resource_type: 'auto' }).catch(() => {});
      }
    }
  }
}
