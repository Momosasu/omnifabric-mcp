# omnifabric-mcp

MCP server giving an LLM SQL access to a CloudSigma OmniFabric database (MatrixOne-compatible, MySQL wire protocol).

## What It Does

Exposes one MCP tool, `run_query`, that runs any SQL statement against your OmniFabric/MatrixOne instance over the standard MySQL wire protocol (via `mysql2`) and returns the rows as JSON. No schema-specific tooling, no query rewriting — whatever SQL you (or the LLM) send is what runs.

## Prerequisites

- Node.js 20.6+ (uses the native `--env-file` flag for local testing)
- A running OmniFabric instance and its connection details: host, port (default 6001), account UUID, username, role, password
- An MCP-compatible client (Claude Code, Claude Desktop, etc.)

## Why a custom server instead of an existing one

- **Memoria** (`matrixorigin/Memoria`) is a semantic-memory product built on MatrixOne (store/retrieve/branch/merge memories), not a raw SQL passthrough tool — doesn't fit.
- **mcp-server-mysql** (generic community MySQL MCP server) looked like a fit but has two bugs for this use case: it hard-rejects any statement its SQL parser doesn't classify as `SELECT` (so `SHOW DATABASES` — the exact acceptance-test query — gets rejected), and it wraps every query in `SET SESSION TRANSACTION READ ONLY`, which isn't confirmed to work on MatrixOne/OmniFabric.
- So: this repo, built directly on `mysql2` + `@modelcontextprotocol/sdk` (both do the heavy lifting — no custom wire protocol). One tool, `run_query`, passes SQL straight through.

## Safety model

There is no app-level statement filtering (that's what broke the alternative above). Instead: **connect with a read-only DB role**. Ask CloudSigma/whoever provisioned the instance for a role scoped to SELECT only, or check whether OmniFabric supports creating one beyond `accountadmin`. Only point this server at a write-capable role if you actually need DDL/write access.

## Quick install via AI agent

Give this prompt to Claude Code (or any AI coding agent with shell access):

> Install the OmniFabric MCP server. Clone https://github.com/Momosasu/omnifabric-mcp.git, run `npm install`, copy `.env.example` to `.env` and ask me for my OmniFabric credentials (host, account UUID, username, role, password) to fill it in, add it to my MCP config at `~/.claude/.mcp.json` with `args` set to `["--env-file=<absolute path to .env>", "<absolute path to index.js>"]`, and verify the connection by calling `run_query` with `SHOW DATABASES`.

## Quick Start

### 1. Install

```bash
git clone https://github.com/Momosasu/omnifabric-mcp.git
cd omnifabric-mcp
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Fill in `.env` with the credentials from your OmniFabric provisioning (CloudSigma console or `mo_ctl` deploy output):

```
OMNIFABRIC_HOST=your-instance.omni.example.cloudsigma.com
OMNIFABRIC_PORT=6001
OMNIFABRIC_ACCOUNT=your-account-uuid
OMNIFABRIC_USER=your-username
OMNIFABRIC_ROLE=your-role
OMNIFABRIC_PASSWORD=your-password
```

Optional: sanity-check the login works before touching MCP at all:
```bash
mysql -h <OMNIFABRIC_HOST> -P 6001 -u <ACCOUNT>:<USER>:<ROLE> -p
```

Then validate your `.env` assembles into a well-formed config (no live DB connection made):
```bash
npm test
```

### 3. Add to Claude Code

Add to your MCP config (`~/.claude/.mcp.json` or project `.mcp.json`), pointing at the `.env` you just filled in — no need to re-enter credentials here:

```json
{
  "mcpServers": {
    "omnifabric": {
      "command": "node",
      "args": ["--env-file=/path/to/omnifabric-mcp/.env", "/path/to/omnifabric-mcp/index.js"]
    }
  }
}
```

Replace `/path/to/omnifabric-mcp` with your actual path.

### 4. Verify

Ask Claude: *"Use run_query to run SHOW DATABASES"*

## Tools

- `run_query(sql)` — runs any SQL statement, returns rows as JSON.

That's it. No `create_snapshot`/`restore_snapshot`/UDF tools yet — the PRD explicitly says not to add those speculatively. Add a wrapper tool once there's a concrete use case for a specific OmniFabric SQL-Reference statement raw passthrough doesn't cover well.
