#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerBlogTools } from "./tools/blog.js";
import { registerProductTools } from "./tools/products.js";
import { registerOrderTools } from "./tools/orders.js";

const server = new McpServer({
  name: "sleep-sheet",
  version: "0.1.0",
});

registerBlogTools(server);
registerProductTools(server);
registerOrderTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
