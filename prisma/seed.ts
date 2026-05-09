import "dotenv/config";

async function main() {
  await import("./seed-testmonial");
  await import("./seed-categories");
  await import("./seed-products");
  console.log("Seeding completed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
