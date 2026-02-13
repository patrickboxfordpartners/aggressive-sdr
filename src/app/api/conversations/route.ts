import { NextResponse } from "next/server";
import { queryInternalDatabase } from "@/server-lib/internal-db-query";

export async function GET() {
  const rows = await queryInternalDatabase(
    "SELECT * FROM sdr_conversations ORDER BY updated_at DESC",
  );
  return NextResponse.json(rows);
}

export async function POST() {
  const rows = await queryInternalDatabase(
    `INSERT INTO sdr_conversations (current_agent, status, qualification_data, enrichment_data)
     VALUES ('scout', 'active', '{}', '{"status":"idle"}')
     RETURNING *`,
  );
  return NextResponse.json(rows[0]);
}
