import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
  // Incremental cache / queue can be added later (R2 or KV based).
  // See https://opennext.js.org/cloudflare for options.
});

export default config;
