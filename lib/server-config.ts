import { db } from "@/db";
import { siteSettings } from "@/db/schema";

async function getSettingsMap(): Promise<Record<string, string>> {
  const settings = await db.select().from(siteSettings);
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function getCloudinaryConfig() {
  const map = await getSettingsMap();
  return {
    cloudName: map.cloudinary_cloud_name || "",
    apiKey: map.cloudinary_api_key || "",
    apiSecret: map.cloudinary_api_secret || "",
  };
}

export async function getSteadfastConfig() {
  const map = await getSettingsMap();
  return {
    apiKey: map.steadfast_api_key || "",
    secretKey: map.steadfast_secret_key || "",
  };
}

export async function getGoogleSheetsConfig() {
  const map = await getSettingsMap();
  return {
    clientEmail: map.google_sheets_client_email || "",
    privateKey: map.google_sheets_private_key || "",
    spreadsheetId: map.google_sheets_spreadsheet_id || "",
  };
}
