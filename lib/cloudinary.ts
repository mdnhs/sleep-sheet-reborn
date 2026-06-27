import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(file: File | Buffer, folder = "categories"): Promise<string> {
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) reject(new Error(error.message))
        else resolve(result!.secure_url)
      }
    )
    stream.end(buffer)
  })
}

export async function deleteImage(url: string): Promise<void> {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return

  const parts = url.split("/")
  const folderAndFile = parts.slice(parts.indexOf("upload") + 2).join("/")
  const publicId = folderAndFile.replace(/\.[^.]+$/, "")

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error) => {
      if (error) reject(new Error(error.message))
      else resolve()
    })
  })
}
