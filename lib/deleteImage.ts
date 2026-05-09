import fs from "fs/promises";
import path from "path";

const IMAGE_FOLDER = path.resolve("images"); 

export const deleteImageFromStorage = async (imageUrl: string) => {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return;

  try {
    const fileName = path.basename(imageUrl);
    const filePath = path.join(IMAGE_FOLDER, fileName);
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`❌ Error deleting image ${imageUrl}:`, error);
  }
};
