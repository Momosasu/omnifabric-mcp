import assert from "node:assert";
import { buildConnectionConfig } from "../lib.js";

const config = buildConnectionConfig(process.env);
assert.ok(config.host, "host missing");
assert.strictEqual(
  config.user,
  `${process.env.OMNIFABRIC_ACCOUNT}:${process.env.OMNIFABRIC_USER}:${process.env.OMNIFABRIC_ROLE}`
);
assert.strictEqual(config.port, Number(process.env.OMNIFABRIC_PORT || 6001));

assert.throws(
  () => buildConnectionConfig({ ...process.env, OMNIFABRIC_HOST: undefined }),
  /Missing required env vars/
);

console.log("ok");
