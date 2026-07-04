# omnifabric-mcp

MCP server giving an LLM SQL access to a CloudSigma OmniFabric database (MatrixOne-compatible, MySQL wire protocol).

## Why a custom server instead of an existing one

- **Memoria** (`matrixorigin/Memoria`) is a semantic-memory product built on MatrixOne (store/retrieve/branch/merge memories), not a raw SQL passthrough tool — doesn't fit.
- **mcp-server-mysql** (generic community MySQL MCP server) looked like a fit but has two bugs for this use case: it hard-rejects any statement its SQL parser doesn't classify as `SELECT` (so `SHOW DATABASES` — the exact acceptance-test query — gets rejected), and it wraps every query in `SET SESSION TRANSACTION READ ONLY`, which isn't confirmed to work on MatrixOne/OmniFabric.
- So: this repo, built directly on `mysql2` + `@modelcontextprotocol/sdk` (both do the heavy lifting — no custom wire protocol). One tool, `run_query`, passes SQL straight through.

## Safety model

There is no app-level statement filtering (that's what broke the alternative above). Instead: **connect with a read-only DB role**. Ask CloudSigma/whoever provisioned the instance for a role scoped to SELECT only, or check whether OmniFabric supports creating one beyond `accountadmin`. Only point this server at a write-capable role if you actually need DDL/write access.

## Quick install via AI agent

Give this prompt to Claude Code (or any AI coding agent with shell access):

> Clone https://github.com/Momosasu/omnifabric-mcp, run `npm install`, copy `.env.example` to `.env`, ask me for my OmniFabric credentials (host, account UUID, username, role, password) and fill them in, run `npm test` to confirm the config is valid, then add it to my MCP client config pointing at the absolute path of `index.js`.

## Setup

1. Copy `.env.example` to `.env` and fill in the credentials from your OmniFabric provisioning (CloudSigma console or `mo_ctl` deploy output):
   ```
   OMNIFABRIC_HOST, OMNIFABRIC_PORT (default 6001), OMNIFABRIC_ACCOUNT, OMNIFABRIC_USER, OMNIFABRIC_ROLE, OMNIFABRIC_PASSWORD
   ```
2. **Verify with the plain `mysql` CLI first**, before touching MCP:
   ```
   mysql -h <OMNIFABRIC_HOST> -P 6001 -u <ACCOUNT>:<USER>:<ROLE> -p
   ```
3. Install deps: `npm install`
4. Run the smoke test (validates your `.env` assembles into a well-formed config — tenant-username format, port, required vars — no live DB connection made): `npm test`
5. Point your MCP client at it, e.g. in `claude_desktop_config.json` / `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "omnifabric": {
         "command": "node",
         "args": ["/absolute/path/to/index.js"],
         "env": {
           "OMNIFABRIC_HOST": "...",
           "OMNIFABRIC_PORT": "6001",
           "OMNIFABRIC_ACCOUNT": "...",
           "OMNIFABRIC_USER": "...",
           "OMNIFABRIC_ROLE": "...",
           "OMNIFABRIC_PASSWORD": "..."
         }
       }
     }
   }
   ```

## Tools

- `run_query(sql)` — runs any SQL statement, returns rows as JSON.

That's it. No `create_snapshot`/`restore_snapshot`/UDF tools yet — the PRD explicitly says not to add those speculatively. Add a wrapper tool once there's a concrete use case for a specific OmniFabric SQL-Reference statement raw passthrough doesn't cover well.
