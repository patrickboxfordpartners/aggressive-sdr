"use client";

import { useState, useCallback } from "react";
import {
  Zap,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  SquareCheck,
  Filter,
  BarChart3,
  List,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AutomationRuleCard, ActionIcon } from "@/components/AutomationRuleCard";
import { AutomationRuleForm } from "@/components/AutomationRuleForm";
import { BulkRulesToolbar } from "@/components/BulkRulesToolbar";
import { BulkLogsToolbar } from "@/components/BulkLogsToolbar";
import { ClearLogsDialog } from "@/components/ClearLogsDialog";
import { AutomationAnalytics } from "@/components/AutomationAnalytics";
import { ExecutionLogTable } from "@/components/ExecutionLogTable";
import { ScheduledReports } from "@/components/ScheduledReports";
import {
  useAutomationRules,
  useAutomationLogs,
  updateAutomationRule,
  deleteAutomationRule,
  getTagStyle,
  getTagLabel,
  type AutomationRule,
  type AutomationLog,
} from "@/client-lib/api-client";

function LogStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "success":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 text-[10px]">
          <CheckCircle2 className="h-3 w-3" /> Success
        </Badge>
      );
    case "error":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1 text-[10px]">
          <XCircle className="h-3 w-3" /> Error
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1 text-[10px]">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
  }
}

export default function AutomationsPage() {
  const { data: rules, isLoading: rulesLoading, mutate: mutateRules } = useAutomationRules();
  const { data: logs, isLoading: logsLoading, mutate: mutateLogs } = useAutomationLogs({ limit: 50 });

  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AutomationRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");

  // Bulk modes
  const [bulkRuleMode, setBulkRuleMode] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [bulkLogMode, setBulkLogMode] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const [clearLogsOpen, setClearLogsOpen] = useState(false);

  const handleEdit = useCallback((rule: AutomationRule) => {
    setEditRule(rule);
    setFormOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditRule(null);
    setFormOpen(true);
  }, []);

  const handleToggle = useCallback(
    async (rule: AutomationRule) => {
      try {
        await updateAutomationRule(rule.id, { enabled: !rule.enabled });
        toast.success(`Rule ${rule.enabled ? "disabled" : "enabled"}`);
        await mutateRules();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to toggle rule: ${msg}`);
      }
    },
    [mutateRules],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteAutomationRule(deleteConfirm.id);
      toast.success("Rule deleted");
      const next = new Set(selectedRuleIds);
      next.delete(deleteConfirm.id);
      setSelectedRuleIds(next);
      setDeleteConfirm(null);
      await mutateRules();
      await mutateLogs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to delete rule: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirm, mutateRules, mutateLogs, selectedRuleIds]);

  const toggleRuleSelection = useCallback(
    (id: string) => {
      const next = new Set(selectedRuleIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedRuleIds(next);
    },
    [selectedRuleIds],
  );

  const toggleLogSelection = useCallback(
    (id: string) => {
      const next = new Set(selectedLogIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedLogIds(next);
    },
    [selectedLogIds],
  );

  const exitBulkRuleMode = useCallback(() => {
    setBulkRuleMode(false);
    setSelectedRuleIds(new Set());
  }, []);

  const exitBulkLogMode = useCallback(() => {
    setBulkLogMode(false);
    setSelectedLogIds(new Set());
  }, []);

  const enabledCount = rules?.filter((r) => r.enabled).length ?? 0;
  const totalCount = rules?.length ?? 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automation Rules
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure actions that fire automatically when export tags are applied.
            {totalCount > 0 && (
              <span className="ml-1">
                {enabledCount} of {totalCount} rules active.
              </span>
            )}
          </p>
        </div>
        {activeTab === "rules" && (
          <Button onClick={handleCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Rule
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules" className="gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5" />
            Rules & Logs
          </TabsTrigger>
          <TabsTrigger value="execution-log" className="gap-1.5 text-xs">
            <List className="h-3.5 w-3.5" />
            Execution Log
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="scheduled-reports" className="gap-1.5 text-xs">
            <CalendarClock className="h-3.5 w-3.5" />
            Scheduled Reports
          </TabsTrigger>
        </TabsList>

        {/* Rules & Logs Tab */}
        <TabsContent value="rules" className="space-y-6 mt-4">
          {/* How it works */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm space-y-1.5">
                  <p className="font-medium">How Automations Work</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>When you tag an export (e.g., &quot;Urgent&quot; or &quot;Escalated&quot;) in the dashboard, enabled rules are checked.</li>
                    <li>If the export&apos;s tags match a rule&apos;s trigger tags, the configured action fires automatically.</li>
                    <li>Actions include creating a <span className="font-medium text-foreground">GitHub Issue</span>, sending an <span className="font-medium text-foreground">In-App Notification</span>, or <span className="font-medium text-foreground">Escalating for Review</span>.</li>
                    <li>All executions are logged below so you can audit what triggered and when.</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Rules</h2>
              {rules && rules.length > 0 && (
                <Button
                  variant={bulkRuleMode ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => (bulkRuleMode ? exitBulkRuleMode() : setBulkRuleMode(true))}
                >
                  <SquareCheck className="h-3.5 w-3.5" />
                  {bulkRuleMode ? "Done" : "Bulk Select"}
                </Button>
              )}
            </div>

            {bulkRuleMode && rules && rules.length > 0 && (
              <BulkRulesToolbar
                rules={rules}
                selectedIds={selectedRuleIds}
                onSelectionChange={setSelectedRuleIds}
                onRefresh={() => mutateRules()}
                onRefreshLogs={() => mutateLogs()}
              />
            )}

            {rulesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : !rules || rules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">No automation rules yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create your first rule to automatically respond when exports are tagged.
                  </p>
                  <Button className="mt-4 gap-1.5" onClick={handleCreate}>
                    <Plus className="h-4 w-4" />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-start gap-2">
                    {bulkRuleMode && (
                      <div className="pt-5 pl-1 shrink-0">
                        <Checkbox
                          checked={selectedRuleIds.has(rule.id)}
                          onCheckedChange={() => toggleRuleSelection(rule.id)}
                        />
                      </div>
                    )}
                    <div
                      className={`flex-1 min-w-0 transition-all ${
                        bulkRuleMode && selectedRuleIds.has(rule.id) ? "ring-2 ring-primary/20 rounded-xl" : ""
                      }`}
                    >
                      <AutomationRuleCard
                        rule={rule}
                        onEdit={handleEdit}
                        onDelete={setDeleteConfirm}
                        onToggle={handleToggle}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Execution Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Automation Logs
                {logs && logs.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{logs.length}</Badge>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {logs && logs.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setClearLogsOpen(true)}>
                      <Filter className="h-3.5 w-3.5" />
                      Clear Logs\u2026
                    </Button>
                    <Button
                      variant={bulkLogMode ? "default" : "outline"}
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => (bulkLogMode ? exitBulkLogMode() : setBulkLogMode(true))}
                    >
                      <SquareCheck className="h-3.5 w-3.5" />
                      {bulkLogMode ? "Done" : "Bulk Select"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {bulkLogMode && logs && logs.length > 0 && (
              <BulkLogsToolbar
                logs={logs}
                selectedIds={selectedLogIds}
                onSelectionChange={setSelectedLogIds}
                onRefresh={() => mutateLogs()}
              />
            )}

            {logsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !logs || logs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No automation executions yet. Logs will appear here after rules are triggered.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[500px]">
                    <div className="divide-y">
                      {logs.map((log: AutomationLog) => {
                        const result = log.result ?? {};
                        const isSelected = selectedLogIds.has(log.id);
                        return (
                          <div
                            key={log.id}
                            className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                              isSelected ? "bg-orange-50/50 dark:bg-orange-950/10" : ""
                            }`}
                          >
                            {bulkLogMode && (
                              <div className="pt-1 shrink-0">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleLogSelection(log.id)}
                                />
                              </div>
                            )}
                            <div className="mt-1 shrink-0">
                              <ActionIcon type={log.action_type} className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{log.rule_name ?? "Unknown Rule"}</span>
                                <LogStatusBadge status={log.status} />
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Export: {log.export_id.slice(0, 12)}\u2026 \u2022{" "}
                                {new Date(log.created_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </p>
                              {log.error_message && (
                                <p className="text-[11px] text-red-500 mt-0.5">{log.error_message}</p>
                              )}
                              {log.status === "success" && result.issue_url && (
                                <a
                                  href={result.issue_url as string}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-500 hover:underline mt-0.5 inline-block"
                                >
                                  View GitHub Issue \u2192
                                </a>
                              )}
                              {log.rule_trigger_tags && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {(log.rule_trigger_tags as string[]).map((tag: string) => (
                                    <Badge key={tag} className={`${getTagStyle(tag)} text-[9px]`}>{getTagLabel(tag)}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Execution Log Tab */}
        <TabsContent value="execution-log" className="mt-4">
          <ExecutionLogTable />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <AutomationAnalytics />
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled-reports" className="mt-4">
          <ScheduledReports />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AutomationRuleForm open={formOpen} onOpenChange={setFormOpen} editRule={editRule} onSave={() => mutateRules()} />

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Rule
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone and all associated logs will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-1.5">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClearLogsDialog open={clearLogsOpen} onOpenChange={setClearLogsOpen} rules={rules ?? []} onClear={() => mutateLogs()} />
    </div>
  );
}
