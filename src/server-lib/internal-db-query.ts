import { neon } from "@neondatabase/serverless";

type SqlPrimitive = string | number | boolean | Date | null;
type SqlParam = SqlPrimitive | SqlPrimitive[] | Record<string, unknown>;

// Initialize Neon client
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return url;
};

export async function queryInternalDatabase(sql: string, params: SqlParam[] = []) {
  const client = neon(getDatabaseUrl());
  const result = await client(sql, params);
  return result as Record<string, unknown>[];
}
