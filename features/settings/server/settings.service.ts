import db from "@/lib/db";

export async function getSettings() {
  const settings = await db.siteSetting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function updateSettings(
  body: Record<string, number | string | undefined>,
) {
  const updates = Object.entries(body).filter(([, v]) => v !== undefined) as [string, number][];

  await Promise.all(
    updates.map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    ),
  );

  return { success: true };
}
