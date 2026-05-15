type RequiredServerEnv = "DATABASE_URL" | "NEXTAUTH_SECRET";

function readRequiredEnv(name: RequiredServerEnv): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  get databaseUrl() {
    return readRequiredEnv("DATABASE_URL");
  },
  get nextAuthSecret() {
    return readRequiredEnv("NEXTAUTH_SECRET");
  },
  get nextAuthUrl() {
    return process.env.NEXTAUTH_URL;
  }
};
