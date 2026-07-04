import assert from "node:assert";
import { buildConnectionConfig } from "../lib.js";

const baseEnv = {
  OMNIFABRIC_HOST: "example.omni.example.com",
  OMNIFABRIC_ACCOUNT: "00000000-0000-0000-0000-000000000000",
  OMNIFABRIC_USER: "testuser",
  OMNIFABRIC_ROLE: "testrole",
  OMNIFABRIC_PASSWORD: "secret",
};

const config = buildConnectionConfig(baseEnv);
assert.strictEqual(config.user, "00000000-0000-0000-0000-000000000000:testuser:testrole");
assert.strictEqual(config.port, 6001);
assert.strictEqual(config.database, undefined);

assert.throws(() => buildConnectionConfig({ ...baseEnv, OMNIFABRIC_HOST: undefined }), /Missing required env vars/);

console.log("ok");
