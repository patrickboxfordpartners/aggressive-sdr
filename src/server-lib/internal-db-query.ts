import { internalDbClient } from "./internal-db";

type SqlPrimitive = string | number | boolean | Date | null;
type SqlParam = SqlPrimitive | SqlPrimitive[] | Record<string, unknown>;

export async function queryInternalDatabase(sql: string, params: SqlParam[] = []) {
  const response = await internalDbClient.post<Record<string, unknown>[]>("/query", { sql, params });
  return response.data;
}
