import { NextRequest, NextResponse } from "next/server";
import { queryInternalDatabase } from "@/server-lib/internal-db-query";
import { getCurrentUser, addOrgFilter, handleAuthError } from "@/server-lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and org context
    const user = await getCurrentUser(request);

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("id");

    if (ruleId) {
      // Get single rule (with org isolation)
      const { sql, params } = addOrgFilter(
        `SELECT * FROM automation_rules WHERE id = $1`,
        [ruleId],
        user.organizationId
      );
      const rows = await queryInternalDatabase(`${sql} LIMIT 1`, params);

      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    // Get all rules for this organization
    const rows = await queryInternalDatabase(
      `SELECT * FROM automation_rules WHERE organization_id = $1 ORDER BY created_at DESC`,
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

    const body = await request.json();
    const { name, description, trigger_tags, trigger_mode, action_type, action_config, enabled } = body;

    // Validation
    if (!name || !action_type) {
      return NextResponse.json({ error: "name and action_type are required" }, { status: 400 });
    }
    if (!Array.isArray(trigger_tags) || trigger_tags.length === 0) {
      return NextResponse.json({ error: "At least one trigger tag is required" }, { status: 400 });
    }

    const validActions = ["github_issue", "in_app_notification", "escalate_review"];
    if (!validActions.includes(action_type)) {
      return NextResponse.json(
        { error: `Invalid action_type. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // Insert with org isolation
    const rows = await queryInternalDatabase(
      `INSERT INTO automation_rules (
        name, description, trigger_tags, trigger_mode, action_type,
        action_config, enabled, created_by, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name,
        description ?? null,
        trigger_tags,
        trigger_mode ?? "any",
        action_type,
        JSON.stringify(action_config ?? {}),
        enabled !== false,
        user.email, // ✅ Real user
        user.organizationId, // ✅ Org isolation
      ]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user and org context
    const user = await getCurrentUser(request);

    const body = await request.json();
    const action = body.action as string | undefined;

    if (action === "bulk-toggle") {
      const { ids, enabled } = body as { ids: string[]; enabled: boolean };
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "ids array is required" }, { status: 400 });
      }
      if (typeof enabled !== "boolean") {
        return NextResponse.json({ error: "enabled boolean is required" }, { status: 400 });
      }

      // Update with org isolation
      const placeholders = ids.map((_, i) => `$${i + 3}`).join(", ");
      const rows = await queryInternalDatabase(
        `UPDATE automation_rules SET enabled = $1, updated_at = NOW()
         WHERE organization_id = $2 AND id IN (${placeholders})
         RETURNING id, enabled`,
        [enabled, user.organizationId, ...ids]
      );

      return NextResponse.json({ updated: rows.length, results: rows });
    }

    if (action === "bulk-delete") {
      const { ids } = body as { ids: string[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "ids array is required" }, { status: 400 });
      }

      // Delete logs first (with org isolation)
      const logPlaceholders = ids.map((_, i) => `$${i + 2}`).join(", ");
      await queryInternalDatabase(
        `DELETE FROM automation_logs
         WHERE organization_id = $1 AND rule_id IN (${logPlaceholders})`,
        [user.organizationId, ...ids]
      );

      // Delete rules (with org isolation)
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ");
      const rows = await queryInternalDatabase(
        `DELETE FROM automation_rules
         WHERE organization_id = $1 AND id IN (${placeholders})
         RETURNING id`,
        [user.organizationId, ...ids]
      );

      return NextResponse.json({ deleted: rows.length });
    }

    // Single rule update
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Rule id is required" }, { status: 400 });

    const setClauses: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let paramIdx = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIdx++}`);
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIdx++}`);
      params.push(updates.description);
    }
    if (updates.trigger_tags !== undefined) {
      setClauses.push(`trigger_tags = $${paramIdx++}`);
      params.push(updates.trigger_tags);
    }
    if (updates.trigger_mode !== undefined) {
      setClauses.push(`trigger_mode = $${paramIdx++}`);
      params.push(updates.trigger_mode);
    }
    if (updates.action_type !== undefined) {
      setClauses.push(`action_type = $${paramIdx++}`);
      params.push(updates.action_type);
    }
    if (updates.action_config !== undefined) {
      setClauses.push(`action_config = $${paramIdx++}`);
      params.push(JSON.stringify(updates.action_config));
    }
    if (updates.enabled !== undefined) {
      setClauses.push(`enabled = $${paramIdx++}`);
      params.push(updates.enabled);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(user.organizationId); // Add org filter
    params.push(id);

    const rows = await queryInternalDatabase(
      `UPDATE automation_rules SET ${setClauses.join(", ")}
       WHERE organization_id = $${paramIdx++} AND id = $${paramIdx}
       RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user and org context
    const user = await getCurrentUser(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Rule id is required" }, { status: 400 });
    }

    // Delete with org isolation
    const rows = await queryInternalDatabase(
      `DELETE FROM automation_rules
       WHERE organization_id = $1 AND id = $2
       RETURNING id`,
      [user.organizationId, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
