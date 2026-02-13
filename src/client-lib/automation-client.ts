import useSWR, { mutate } from "swr";
import { apiClient } from "./api-client";

const fetcher = <T>(url: string) => apiClient.get<T>(url).then((res) => res.data);

// Types

export interface AutomationRuleActionConfig {
  repo?: string;
  labels?: string[];
  assignees?: string[];
  title?: string;
  severity?: "info" | "warning" | "critical";
  notify_message?: string;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_tags: string[];
  trigger_mode: "any" | "all";
  action_type: "github_issue" | "in_app_notification" | "escalate_review";
  action_config: AutomationRuleActionConfig;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  export_id: string;
  action_type: string;
  status: "pending" | "success" | "error";
  result: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  rule_name?: string;
  rule_action_type?: string;
  rule_trigger_tags?: string[];
}

export interface AutomationLogDetailed extends AutomationLog {
  rule_action_config?: Record<string, unknown>;
  rule_trigger_mode?: "any" | "all";
  rule_description?: string | null;
}

export interface AutomationLogFilters {
  rule_id?: string;
  export_id?: string;
  status?: string;
  action_type?: string;
  date_from?: string;
  date_to?: string;
  tag?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AutomationLogPage {
  logs: AutomationLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AutomationTriggerResponse {
  triggered: number;
  rules?: Array<{ rule_id: string; rule_name: string; action_type: string }>;
  message?: string;
}

// Hooks

export function useAutomationRules() {
  return useSWR<AutomationRule[], Error>("/automation-rules", fetcher);
}

export function useAutomationLogs(filters: { rule_id?: string; export_id?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.rule_id) params.set("rule_id", filters.rule_id);
  if (filters.export_id) params.set("export_id", filters.export_id);
  if (filters.limit) params.set("limit", String(filters.limit));
  return useSWR<AutomationLog[], Error>(`/automation-logs?${params.toString()}`, fetcher);
}

export function useAutomationLogsPaginated(filters: AutomationLogFilters = {}) {
  const params = new URLSearchParams();
  if (filters.rule_id) params.set("rule_id", filters.rule_id);
  if (filters.export_id) params.set("export_id", filters.export_id);
  if (filters.status) params.set("status", filters.status);
  if (filters.action_type) params.set("action_type", filters.action_type);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort_by) params.set("sort_by", filters.sort_by);
  if (filters.sort_dir) params.set("sort_dir", filters.sort_dir);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const key = `/automation-logs?${params.toString()}`;
  return useSWR<AutomationLogPage, Error>(key, fetcher);
}

export function useAutomationLogDetail(id: string | null) {
  return useSWR<AutomationLogDetailed, Error>(
    id ? `/automation-logs?id=${id}` : null,
    fetcher,
  );
}

export function exportAutomationLogsCsv(logs: AutomationLog[]): string {
  const headers = ["ID","Rule Name","Action Type","Export ID","Status","Error Message","Trigger Tags","Created At"];
  const esc = (v: string | null | undefined): string => {
    const s = v ?? "";
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = logs.map((l) =>
    [l.id, l.rule_name ?? "Unknown", l.action_type, l.export_id, l.status, l.error_message, Array.isArray(l.rule_trigger_tags) ? l.rule_trigger_tags.join("; ") : "", l.created_at].map(esc).join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

// Single Rule CRUD

export async function createAutomationRule(data: {
  name: string;
  description?: string;
  trigger_tags: string[];
  trigger_mode?: "any" | "all";
  action_type: "github_issue" | "in_app_notification" | "escalate_review";
  action_config: AutomationRuleActionConfig;
  enabled?: boolean;
}): Promise<AutomationRule> {
  try {
    return await apiClient.post<AutomationRule>("/automation-rules", data).then((res) => res.data);
  } finally {
    await mutate("/automation-rules");
  }
}

export async function updateAutomationRule(
  id: string,
  data: Partial<Omit<AutomationRule, "id" | "created_at" | "updated_at" | "created_by">>,
): Promise<AutomationRule> {
  try {
    return await apiClient.patch<AutomationRule>("/automation-rules", { id, ...data }).then((res) => res.data);
  } finally {
    await mutate("/automation-rules");
  }
}

export async function deleteAutomationRule(id: string): Promise<void> {
  try {
    await apiClient.delete(`/automation-rules?id=${id}`);
  } finally {
    await mutate("/automation-rules");
  }
}

// Bulk Rule Actions

export async function bulkToggleAutomationRules(ids: string[], enabled: boolean): Promise<{ updated: number; results: Array<{ id: string; enabled: boolean }> }> {
  try {
    return await apiClient.patch<{ updated: number; results: Array<{ id: string; enabled: boolean }> }>("/automation-rules", { action: "bulk-toggle", ids, enabled }).then((res) => res.data);
  } finally {
    await mutate("/automation-rules");
  }
}

export async function bulkDeleteAutomationRules(ids: string[]): Promise<{ deleted: number }> {
  try {
    return await apiClient.patch<{ deleted: number }>("/automation-rules", { action: "bulk-delete", ids }).then((res) => res.data);
  } finally {
    await mutate("/automation-rules");
    await mutate((key: unknown) => typeof key === "string" && key.startsWith("/automation-logs"), undefined, { revalidate: true });
  }
}

// Bulk Log Actions

export async function bulkDeleteAutomationLogs(ids: string[]): Promise<{ deleted: number }> {
  try {
    return await apiClient.delete<{ deleted: number }>(`/automation-logs?action=bulk&ids=${ids.join(",")}`).then((res) => res.data);
  } finally {
    await mutate((key: unknown) => typeof key === "string" && key.startsWith("/automation-logs"), undefined, { revalidate: true });
  }
}

export async function clearAutomationLogs(filters: { rule_id?: string; status?: string; older_than_days?: number }): Promise<{ deleted: number }> {
  try {
    const params = new URLSearchParams({ action: "clear" });
    if (filters.rule_id) params.set("rule_id", filters.rule_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.older_than_days) params.set("older_than_days", String(filters.older_than_days));
    return await apiClient.delete<{ deleted: number }>(`/automation-logs?${params.toString()}`).then((res) => res.data);
  } finally {
    await mutate((key: unknown) => typeof key === "string" && key.startsWith("/automation-logs"), undefined, { revalidate: true });
  }
}

// Automation Trigger

export async function triggerAutomations(exportId: string, tags: string[], previousTags: string[]): Promise<AutomationTriggerResponse> {
  try {
    return await apiClient.post<AutomationTriggerResponse>("/automation-trigger", { export_id: exportId, tags, previous_tags: previousTags }).then((res) => res.data);
  } finally {
    await mutate((key: unknown) => typeof key === "string" && key.startsWith("/automation-logs"), undefined, { revalidate: true });
  }
}

// Analytics

export interface AutomationAnalyticsFilters { rule_id?: string; status?: string; date_from?: string; date_to?: string; }
export interface AutomationAnalyticsStats { total_executions: number; success_count: number; error_count: number; pending_count: number; success_rate: number; active_rules: number; unique_exports: number; }
export interface AutomationAnalyticsTrendPoint { date: string; total: number; success: number; errors: number; pending: number; }
export interface AutomationAnalyticsRuleBreakdown { rule_id: string; rule_name: string | null; action_type: string; rule_enabled: boolean; total: number; success: number; errors: number; }
export interface AutomationAnalyticsError { id: string; rule_id: string; export_id: string; action_type: string; error_message: string | null; created_at: string; rule_name: string | null; }
export interface AutomationAnalyticsData { stats: AutomationAnalyticsStats; trend: AutomationAnalyticsTrendPoint[]; status_breakdown: Array<{ status: string; count: number }>; rule_breakdown: AutomationAnalyticsRuleBreakdown[]; action_type_breakdown: Array<{ action_type: string; count: number }>; top_tags: Array<{ tag: string; count: number }>; recent_errors: AutomationAnalyticsError[]; hourly_activity: Array<{ hour: number; count: number }>; }

export function useAutomationAnalytics(filters: AutomationAnalyticsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.rule_id) params.set("rule_id", filters.rule_id);
  if (filters.status) params.set("status", filters.status);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  return useSWR<AutomationAnalyticsData, Error>(`/automation-logs/analytics?${params.toString()}`, fetcher);
}

export const ACTION_TYPE_META: Record<string, { label: string; icon: string; description: string; color: string }> = {
  github_issue: { label: "GitHub Issue", icon: "Github", description: "Create a GitHub issue for tracking and assignment", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" },
  in_app_notification: { label: "In-App Notification", icon: "Bell", description: "Show an in-app notification to the ops team", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  escalate_review: { label: "Escalate for Review", icon: "AlertTriangle", description: "Flag for priority team review", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};
