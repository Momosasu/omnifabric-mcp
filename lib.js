// Pure helpers, kept free of side effects so they're testable without a live DB.

export function buildConnectionConfig(env) {
  const { OMNIFABRIC_HOST, OMNIFABRIC_ACCOUNT, OMNIFABRIC_USER, OMNIFABRIC_ROLE, OMNIFABRIC_PASSWORD } = env;
  const missing = ["OMNIFABRIC_HOST", "OMNIFABRIC_ACCOUNT", "OMNIFABRIC_USER", "OMNIFABRIC_ROLE", "OMNIFABRIC_PASSWORD"]
    .filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  return {
    host: OMNIFABRIC_HOST,
    port: Number(env.OMNIFABRIC_PORT || 6001),
    user: `${OMNIFABRIC_ACCOUNT}:${OMNIFABRIC_USER}:${OMNIFABRIC_ROLE}`,
    password: OMNIFABRIC_PASSWORD,
    database: env.OMNIFABRIC_DATABASE || undefined,
    multipleStatements: false,
  };
}
