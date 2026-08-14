import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// ─── Allowlists (exported so controllers can do a server-side re-check) ────────
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  // Code files (text-based only — NO executables)
  'text/javascript',
  'application/json',
  'text/html',
  'text/css',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Cloudinary SDK config ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Storage engine ────────────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Sanitize filename — keep only alphanumeric, dots, dashes, underscores
    const sanitizedName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .substring(0, 100); // cap length to avoid overly long public_ids

    // Determine resource_type safely — never use 'auto' for untrusted uploads
    let resource_type = 'raw'; // default to raw (safest for documents/archives/code)
    if (file.mimetype.startsWith('image/')) resource_type = 'image';
    if (file.mimetype.startsWith('video/')) resource_type = 'video';

    // Restrict Cloudinary to only the expected formats per resource type
    const allowedFormats = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      video: ['mp4', 'mov', 'avi'],
      raw: ['pdf', 'doc', 'docx', 'txt', 'zip', 'js', 'json', 'html', 'css'],
    };

    return {
      folder: 'skillx/workspace',
      resource_type,
      allowed_formats: allowedFormats[resource_type],
      public_id: `${Date.now()}-${sanitizedName}`,
      // Auto-optimize images on delivery (quality + format negotiation)
      ...(resource_type === 'image' && {
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }),
    };
  },
});

// ─── Multer instance ───────────────────────────────────────────────────────────
export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'File type not allowed. Accepted types: images, PDFs, documents, zip, and code files.'
        ),
        false
      );
    }
  },
});

export default cloudinary;
