import { NextRequest, NextResponse } from "next/server";
import { queryInternalDatabase } from "@/server-lib/internal-db-query";
import { getCurrentUser, handleAuthError } from "@/server-lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and org context
    const user = await getCurrentUser(request);

    const rows = await queryInternalDatabase(
      "SELECT * FROM sdr_conversations WHERE organization_id = $1 ORDER BY updated_at DESC",
      [user.organizationId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user and org context
    const user = await getCurrentUser(request);

    const rows = await queryInternalDatabase(
      `INSERT INTO sdr_conversations (current_agent, status, qualification_data, enrichment_data, organization_id)
       VALUES ('scout', 'active', '{}', '{"status":"idle"}', $1)
       RETURNING *`,
      [user.organizationId]
    );
    return NextResponse.json(rows[0]);
  } catch (error) {
    return handleAuthError(error);
  }
}
