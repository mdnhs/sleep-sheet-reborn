import { google } from "googleapis";
import { getGoogleSheetsConfig } from "@/lib/server-config";

const SHEET_NAME = "Sheet1";
const HEADER_ROW = [
  "Date",
  "Order ID",
  "Customer Name",
  "Phone",
  "Address",
  "Qty",
  "Total Order Amount",
  "Bought Cost",
  "Shipping/Delivery Cost",
];

export interface SheetOrderRow {
  date: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  quantity: number;
  totalAmount: number;
  boughtCost: number;
  shippingCost: number;
}

async function getSheetsClient() {
  const config = await getGoogleSheetsConfig();
  if (!config.clientEmail || !config.privateKey || !config.spreadsheetId) {
    throw new Error("Google Sheets is not configured. Set it up in Settings > Shipping & Courier.");
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    // The key is pasted into a plain text setting field, so literal "\n"
    // sequences (not real newlines) are how it survives that round trip.
    key: config.privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId: config.spreadsheetId };
}

async function ensureHeaderRow(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:I1`,
  });
  const firstRow = res.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADER_ROW] },
    });
  }
}

// Appends one row per order to the configured spreadsheet, writing the
// header row first if the sheet is still empty. Order is a single flat log
// (not one tab per day) — the Date column is what makes it sortable/
// filterable by day in Sheets itself.
export async function appendOrdersToSheet(rows: SheetOrderRow[]): Promise<void> {
  if (rows.length === 0) return;

  const { sheets, spreadsheetId } = await getSheetsClient();
  await ensureHeaderRow(sheets, spreadsheetId);

  const values = rows.map((r) => [
    r.date,
    r.orderNumber,
    r.customerName,
    r.phone,
    r.address,
    r.quantity,
    r.totalAmount,
    r.boughtCost,
    r.shippingCost,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}
