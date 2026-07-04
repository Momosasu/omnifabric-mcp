#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";
import { buildConnectionConfig } from "./lib.js";

const pool = mysql.createPool(buildConnectionConfig(process.env));

const server = new Server(
  { name: "omnifabric-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "run_query",
      description:
        "Run a SQL statement against the OmniFabric database and return the results. " +
        "Safety is enforced by the DB user's role/grants, not by this tool — use a read-only account unless writes are explicitly needed.",
      inputSchema: {
        type: "object",
        properties: { sql: { type: "string", description: "SQL statement to execute" } },
        required: ["sql"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "run_query") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  const { sql } = request.params.arguments ?? {};
  try {
    const [rows] = await pool.query(sql);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
