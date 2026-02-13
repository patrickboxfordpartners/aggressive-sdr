import { NextRequest, NextResponse } from "next/server";
import { queryInternalDatabase } from "@/server-lib/internal-db-query";

// ── GET: List or fetch a single email template ──────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const rows = await queryInternalDatabase(
      `SELECT * FROM email_templates WHERE id = $1`,
      [id],
    );
    if (!rows[0]) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  }

  const rows = await queryInternalDatabase(
    `SELECT * FROM email_templates
     WHERE owner_email = $1 OR shared = true
     ORDER BY is_default DESC, name ASC`,
    ["john.doe@example.com"],
  );
  return NextResponse.json(rows);
}

// ── POST: Create a new email template ───────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    name,
    description,
    subject_template,
    body_template,
    shared = false,
  } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!subject_template || typeof subject_template !== "string") {
    return NextResponse.json({ error: "Subject template is required" }, { status: 400 });
  }
  if (!body_template || typeof body_template !== "string") {
    return NextResponse.json({ error: "Body template is required" }, { status: 400 });
  }

  const rows = await queryInternalDatabase(
    `INSERT INTO email_templates (name, description, subject_template, body_template, shared, owner_email)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name.trim(), description ?? null, subject_template, body_template, shared, "john.doe@example.com"],
  );

  return NextResponse.json(rows[0]);
}

// ── PATCH: Update an email template ─────────────────────────────────
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const id = body.id as string;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const existing = await queryInternalDatabase(
    `SELECT * FROM email_templates WHERE id = $1`,
    [id],
  );
  if (!existing[0]) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  type SqlParam = string | number | boolean | null;
  const updates: string[] = [];
  const values: SqlParam[] = [];
  let idx = 1;

  const fields = ["name", "description", "subject_template", "body_template", "shared", "is_default"];
  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${idx}`);
      values.push(body[field] as SqlParam);
      idx++;
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const rows = await queryInternalDatabase(
    `UPDATE email_templates SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );

  return NextResponse.json(rows[0]);
}

// ── DELETE: Delete an email template ────────────────────────────────
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await queryInternalDatabase(
    `DELETE FROM email_templates WHERE id = $1 AND owner_email = $2`,
    [id, "john.doe@example.com"],
  );

  return NextResponse.json({ success: true });
}
