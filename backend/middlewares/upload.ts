// middlewares/upload.ts
import { Request } from 'express'
import fs from 'fs'
import multer, { StorageEngine } from 'multer'

const uploadDir: string = 'uploads/'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// Map allowed MIME types to their secure file extensions
const mimeToExtension: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
}

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)

    // Force the file extension based on the validated MIME type.
    // This prevents File Extension Spoofing (e.g., uploading shell.php as image/jpeg).
    const safeExtension = mimeToExtension[file.mimetype] || '.bin'

    cb(null, `${file.fieldname}-${uniqueSuffix}${safeExtension}`)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit

  // First line of defense: filter by MIME type
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    // We can use the keys from our mimeToExtension object as the allowed list
    const allowedMimeTypes = Object.keys(mimeToExtension)

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('This file type is not allowed in the system'), false)
    }

    cb(null, true)
  },
})

export default upload
