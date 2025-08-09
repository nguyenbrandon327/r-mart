import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables normally; in production on ECS use task role credentials
dotenv.config();

// Configure S3 client
// Credentials are resolved by the default provider chain (ECS Task Role in AWS)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

// Configure multer for S3 upload
export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      // Determine folder based on route or other context
      let folder = 'products';
      if (req.originalUrl.includes('/message')) {
        folder = 'messages';
      } else if (req.originalUrl.includes('/profile-pic')) {
        folder = 'profile-pics';
      }
      cb(null, `${folder}/${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|webp/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

// Function to delete a file from S3
export const deleteFileFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Extract S3 key from a full URL
export const getS3KeyFromUrl = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Extract the key from the URL path
    // The URL will be in format: https://bucket-name.s3.region.amazonaws.com/products/image.jpg
    // We need to extract "products/image.jpg"
    const pathname = urlObj.pathname;
    if (pathname.startsWith('/')) {
      return pathname.slice(1); // Remove the leading slash
    }
    return pathname;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}; 