import { NextRequest, NextResponse } from "next/server";
import { queryInternalDatabase } from "@/server-lib/internal-db-query";
import { getCurrentUser, handleAuthError } from "@/server-lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and org context
    const user = await getCurrentUser(request);
  const { searchParams } = new URL(request.url);
  const ruleId = searchParams.get("rule_id");
  const exportId = searchParams.get("export_id");
  const status = searchParams.get("status");
  const actionType = searchParams.get("action_type");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sort_by") ?? "created_at";
  const sortDir = searchParams.get("sort_dir") === "asc" ? "ASC" : "DESC";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;
  const logId = searchParams.get("id");
  if (logId) {
    const rows = await queryInternalDatabase(
      `SELECT al.*, ar.name as rule_name, ar.action_type as rule_action_type,
              ar.trigger_tags as rule_trigger_tags, ar.action_config as rule_action_config,
              ar.trigger_mode as rule_trigger_mode, ar.description as rule_description
       FROM automation_logs al
       LEFT JOIN automation_rules ar ON al.rule_id = ar.id
       WHERE al.id = $1 AND al.organization_id = $2`,
      [logId, user.organizationId]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Log not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  }

  // Add org filter as first condition
  const conditions: string[] = [`al.organization_id = $1`];
  const params: (string | number)[] = [user.organizationId];
  let idx = 2; // Start at 2 since org_id is $1
  if (ruleId) { conditions.push(`al.rule_id = $${idx++}`); params.push(ruleId); }
  if (exportId) { conditions.push(`al.export_id = $${idx++}`); params.push(exportId); }
  if (status) { conditions.push(`al.status = $${idx++}`); params.push(status); }
  if (actionType) { conditions.push(`al.action_type = $${idx++}`); params.push(actionType); }
  if (dateFrom) { conditions.push(`al.created_at >= $${idx++}::timestamptz`); params.push(dateFrom); }
  if (dateTo) { conditions.push(`al.created_at <= $${idx++}::timestamptz`); params.push(`${dateTo}T23:59:59.999Z`); }
  if (tag) { conditions.push(`$${idx++} = ANY(ar.trigger_tags)`); params.push(tag); }
  if (search) { conditions.push(`(ar.name ILIKE $${idx} OR al.export_id ILIKE $${idx} OR al.error_message ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortColumnMap: Record<string, string> = { created_at: "al.created_at", status: "al.status", action_type: "al.action_type", rule_name: "ar.name", export_id: "al.export_id" };
  const sortColumn = sortColumnMap[sortBy] ?? "al.created_at";
  const countRows = await queryInternalDatabase(`SELECT COUNT(*)::int AS total FROM automation_logs al LEFT JOIN automation_rules ar ON al.rule_id = ar.id ${where}`, params);
  const total = (countRows[0] as { total: number } | undefined)?.total ?? 0;
  const rows = await queryInternalDatabase(`SELECT al.*, ar.name as rule_name, ar.action_type as rule_action_type, ar.trigger_tags as rule_trigger_tags, ar.action_config as rule_action_config, ar.trigger_mode as rule_trigger_mode FROM automation_logs al LEFT JOIN automation_rules ar ON al.rule_id = ar.id ${where} ORDER BY ${sortColumn} ${sortDir} LIMIT $${idx++} OFFSET $${idx++}`, [...params, limit, offset]);
    const isAdvanced = !!(searchParams.get("sort_by") || searchParams.get("sort_dir") || searchParams.get("page") || searchParams.get("action_type") || searchParams.get("date_from") || searchParams.get("date_to") || searchParams.get("tag") || searchParams.get("search"));
    if (isAdvanced) return NextResponse.json({ logs: rows, total, page, limit });
    return NextResponse.json(rows);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user and org context
    const user = await getCurrentUser(request);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "bulk") {
      const idsParam = searchParams.get("ids");
      if (!idsParam) return NextResponse.json({ error: "ids parameter is required" }, { status: 400 });

      const ids = idsParam.split(",").filter(Boolean);
      if (ids.length === 0) return NextResponse.json({ error: "No ids provided" }, { status: 400 });

      const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ");
      const rows = await queryInternalDatabase(
        `DELETE FROM automation_logs
         WHERE organization_id = $1 AND id IN (${placeholders})
         RETURNING id`,
        [user.organizationId, ...ids]
      );

      return NextResponse.json({ deleted: rows.length });
    }

    if (action === "clear") {
      const ruleId = searchParams.get("rule_id");
      const status = searchParams.get("status");
      const olderThanDays = searchParams.get("older_than_days");

      // Start with org filter
      const conditions: string[] = [`organization_id = $1`];
      const params: (string | number)[] = [user.organizationId];
      let idx = 2;

      if (ruleId) {
        conditions.push(`rule_id = $${idx++}`);
        params.push(ruleId);
      }
      if (status) {
        conditions.push(`status = $${idx++}`);
        params.push(status);
      }
      if (olderThanDays) {
        const days = parseInt(olderThanDays, 10);
        if (!isNaN(days) && days > 0) {
          conditions.push(`created_at < NOW() - INTERVAL '${days} days'`);
        }
      }

      if (conditions.length === 1) {
        // Only org filter, require at least one more
        return NextResponse.json(
          { error: "At least one filter is required to clear logs" },
          { status: 400 }
        );
      }

      const where = `WHERE ${conditions.join(" AND ")}`;
      const rows = await queryInternalDatabase(
        `DELETE FROM automation_logs ${where} RETURNING id`,
        params
      );

      return NextResponse.json({ deleted: rows.length });
    }

    return NextResponse.json({ error: "Invalid action. Use 'bulk' or 'clear'" }, { status: 400 });
  } catch (error) {
    return handleAuthError(error);
  }
}
