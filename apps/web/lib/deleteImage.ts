// Deletes an image from Cloudinary. Only acts on Cloudinary URLs; external
// URLs (e.g. unsplash) are skipped.

async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Pull the public_id (incl. folder, no extension) out of a Cloudinary URL.
// e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/products/abc.jpg
//   -> products/abc
function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return null;
  return match[1].replace(/\.[^/.]+$/, "");
}

export const deleteImageFromStorage = async (imageUrl: string) => {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return;

  const publicId = publicIdFromUrl(imageUrl);
  if (!publicId) return;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await sha1Hex(
      `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    );

    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("signature", signature);

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: form,
    });
  } catch (error) {
    console.error(`❌ Error deleting image ${imageUrl}:`, error);
  }
};
