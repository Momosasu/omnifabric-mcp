# OmniFabric MCP Server — PRD

## 1. Goal

Give an LLM (via MCP) tool access to a CloudSigma OmniFabric database instance: run SQL, inspect schema, and (optionally) manage OmniFabric-specific features like snapshots and UDFs.

## 2. Background — read before building

OmniFabric is CloudSigma's hosted database offering. It only ships documentation, no SDK. Research established:

- OmniFabric is **MySQL wire-protocol compatible** ("use MySQL statements directly in most cases").
- It is almost certainly a rebranded deployment of **MatrixOne** (open-source HTAP database) — identical architecture description, same `mo_ctl` deploy tool, same default port `6001`, same multi-tenant login format, same `accountadmin` role name.
- Login is standard MySQL auth, just with MatrixOne's tenant-scoped username:
  ```
  mysql -h <host> -P 6001 -u <account>:<username>:<role> -p
  ```
  Example seen in the wild: `-h database.omni.jhb.cloudsigma.com -P 6001 -u 019f27ec-6db6-794e-a62d-57e17f765c5b:admin:accountadmin`
- There is **no API key**. Credentials = host, port, account UUID, username, role, password — obtained from wherever the OmniFabric instance was provisioned (CloudSigma console) or set at deploy time (`mo_ctl`).
- MatrixOrigin (MatrixOne's maker) already publishes an MCP server: `matrixorigin/Memoria` (GitHub), which connects an LLM to MatrixOne over stdio with vector/semantic retrieval and git-for-data (snapshot/branch/merge) tools.

**Implication for this build: do not write a MySQL client from scratch.** Start from an existing MySQL-speaking MCP server (Memoria, or a generic community MySQL MCP server) and point its connection config at OmniFabric. Only add custom tools for things a generic MySQL server wouldn't know about.

## 3. Non-goals

- No new wire protocol / driver implementation — a MySQL driver already works.
- No auth system of our own — pass through whatever CloudSigma issues.
- No UI. This is a tool-only MCP server (stdio transport, matching the Memoria pattern).

## 4. Build steps

1. **Get a live OmniFabric instance + credentials.** Confirm you can connect with the plain `mysql` CLI first — host, port 6001, `-u account:username:role`, password. Do not proceed to MCP work until this connects.
2. **Evaluate `matrixorigin/Memoria` first.** Clone it, read its config (env vars / connection string format), and try pointing it at the OmniFabric credentials above. If it connects and runs a query, most of this PRD is already done — skip to step 5.
3. **If Memoria doesn't fit** (too opinionated, missing plain SQL passthrough, etc.), fall back to a generic MySQL MCP server (e.g. from the official `modelcontextprotocol/servers` registry or a maintained community one) and configure it the same way.
4. **Verify standard MySQL compatibility gaps.** Some MatrixOne/OmniFabric SQL diverges from MySQL (e.g. `RESTORE SNAPSHOT`, distributed DDL, Python UDF management — see OmniFabric SQL Reference docs). Confirm which of these the base MCP server already exposes via raw SQL passthrough (likely most, since it's just SQL text) vs. which need a dedicated tool wrapper.
5. **Add OmniFabric-specific tools only if raw SQL passthrough isn't enough**, e.g.:
   - `create_snapshot` / `restore_snapshot`
   - `list_udfs` / `deploy_python_udf`
   Each wraps a specific SQL statement from the OmniFabric SQL Reference (`docs.cloudsigma.com/projects/omnifabric/en/latest/OmniFabric/Reference/SQL-Reference/`). Don't build these speculatively — only add a tool once you have a concrete use case for it.
6. **Config**: expose host/port/account/username/role/password as environment variables (standard MCP server config pattern), never hardcoded.
7. **Safety**: default to a read-only DB user/role for query tools. Only wire up write/DDL tools (snapshot restore, UDF deploy) if the user explicitly needs them, and document that clearly in the server's README.

## 5. Acceptance criteria

- `mysql` CLI connects successfully to the OmniFabric instance using the documented login format.
- MCP server starts and lists at least one working tool (e.g. `run_query`).
- A test query (e.g. `SHOW DATABASES;`) round-trips through the MCP tool call and returns real data.
- Credentials are read from environment/config, not committed to any file.

## 6. Open questions to resolve during build

- Does Memoria's tenant/account handling assume MatrixOne's default `sys` account, or does it support the custom UUID-account format CloudSigma issues? Check before assuming drop-in compatibility.
- Does the OmniFabric instance allow creating a scoped read-only role, or only the `accountadmin` role shown above? Ask CloudSigma support/docs if unclear.
