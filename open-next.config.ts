import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Incremental cache / queue can be added later (R2 or KV based).
  // See https://opennext.js.org/cloudflare for options.
});
