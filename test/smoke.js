import assert from "node:assert";
import { buildConnectionConfig } from "../lib.js";

const baseEnv = {
  OMNIFABRIC_HOST: "database.omni.jhb.cloudsigma.com",
  OMNIFABRIC_ACCOUNT: "019f27ec-6db6-794e-a62d-57e17f765c5b",
  OMNIFABRIC_USER: "admin",
  OMNIFABRIC_ROLE: "accountadmin",
  OMNIFABRIC_PASSWORD: "secret",
};

const config = buildConnectionConfig(baseEnv);
assert.strictEqual(config.user, "019f27ec-6db6-794e-a62d-57e17f765c5b:admin:accountadmin");
assert.strictEqual(config.port, 6001);
assert.strictEqual(config.database, undefined);

assert.throws(() => buildConnectionConfig({ ...baseEnv, OMNIFABRIC_HOST: undefined }), /Missing required env vars/);

console.log("ok");
