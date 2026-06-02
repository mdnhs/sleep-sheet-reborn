// Image storage via Cloudinary's HTTP API (works on Cloudflare Workers; no
// filesystem / R2 needed). Signed uploads — only needs cloud name + key + secret.

interface SavedImage {
  filename: string; // Cloudinary public_id
  path: string; // public_id
  url: string; // secure_url (https://res.cloudinary.com/...)
}

function cfg() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary env missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
    );
  }
  return { cloudName, apiKey, apiSecret };
}

async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Uploads an image to Cloudinary.
 * @param file File object or Buffer
 */
export async function imageStorage(file: File | Buffer): Promise<SavedImage> {
  const { cloudName, apiKey, apiSecret } = cfg();

  const blob =
    file instanceof File ? file : new Blob([file as unknown as BlobPart]);

  // Signed upload: signature = sha1 of sorted params + api_secret.
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "products";
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = await sha1Hex(`${toSign}${apiSecret}`);

  const form = new FormData();
  form.append("file", blob);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Cloudinary upload failed:", res.status, text);
    throw new Error("Failed to save image");
  }

  const data = (await res.json()) as { secure_url: string; public_id: string };
  return {
    filename: data.public_id,
    path: data.public_id,
    url: data.secure_url,
  };
}
