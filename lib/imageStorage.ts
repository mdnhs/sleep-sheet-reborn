import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const IMAGE_UPLOAD_DIR = path.join(process.cwd(), 'images');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(IMAGE_UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating upload directory:', err);
    throw new Error('Failed to create upload directory');
  }
}

interface SavedImage {
  filename: string;
  path: string;
  url: string; // URL to access the image via your API
}

/**
 * Saves an image file to the server
 * @param file File object or Buffer
 * @returns Promise with saved image info
 */
export async function imageStorage(file: File | Buffer): Promise<SavedImage> {
  await ensureUploadDir();
  
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const extension = file instanceof File ? 
    file.name.split('.').pop()?.toLowerCase() || 'jpg' : 
    'jpg';
  const filename = `${uuidv4()}.${extension}`;
  const filePath = path.join(IMAGE_UPLOAD_DIR, filename);

  try {
    await fs.writeFile(filePath, buffer);
    return {
      filename,
      path: filePath,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/products/images/${filename}`
    };
  } catch (err) {
    console.error('Error saving image:', err);
    throw new Error('Failed to save image');
  }
}