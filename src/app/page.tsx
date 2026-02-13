"use client";

import { useState, useCallback, useMemo } from "react";
import { ConversationList } from "@/components/ConversationList";
import { ChatView } from "@/components/ChatView";
import { LeadSummary } from "@/components/LeadSummary";
import { BulkExportDialog } from "@/components/BulkExportDialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Upload,
  CheckSquare,
  X,
} from "lucide-react";
import { useConversations } from "@/client-lib/api-client";
import type { SdrConversation } from "@/shared/models/sdr";

export default function HomePage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkExport, setShowBulkExport] = useState(false);

  const { data: conversations } = useConversations();

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (conversations) {
      setSelectedIds(new Set(conversations.map((c) => c.id)));
    }
  }, [conversations]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const enterBulkMode = useCallback(() => {
    setBulkMode(true);
    setSelectedIds(new Set());
  }, []);

  const exitBulkMode = useCallback(() => {
    setBulkMode(false);
    setSelectedIds(new Set());
  }, []);

  const selectedConversations: SdrConversation[] = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter((c) => selectedIds.has(c.id));
  }, [conversations, selectedIds]);

  const handleBulkExportComplete = useCallback(() => {
    setSelectedIds(new Set());
    setBulkMode(false);
  }, []);

  return (
    <div className="flex h-[calc(100vh-2rem)] -m-4 overflow-hidden">
      {/* Left Panel — Conversations */}
      <div className="w-72 border-r flex flex-col shrink-0 bg-background">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="font-bold text-base">SDR Strike Team</h1>
        </div>

        {/* Bulk mode toggle */}
        <div className="px-3 py-2 border-b flex items-center justify-between">
          {!bulkMode ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs h-7"
              onClick={enterBulkMode}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Bulk Select
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <Badge variant="secondary" className="text-xs gap-1">
                <CheckSquare className="h-3 w-3" />
                Bulk Mode
              </Badge>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={exitBulkMode}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <ConversationList
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          bulkMode={bulkMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
        />

        {/* Bulk action toolbar — fixed at bottom */}
        {bulkMode && selectedIds.size > 0 && (
          <div className="border-t bg-background p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] px-1.5"
                onClick={deselectAll}
              >
                Clear
              </Button>
            </div>
            <Button
              className="w-full gap-1.5 text-xs h-8"
              size="sm"
              onClick={() => setShowBulkExport(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              Export {selectedIds.size} Lead{selectedIds.size !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>

      {/* Center Panel — Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView conversationId={activeConversationId} />
      </div>

      {/* Right Panel — Lead Intel */}
      <div className="w-64 border-l shrink-0 bg-background overflow-y-auto">
        <div className="px-3 py-3 border-b">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Intel</h2>
        </div>
        <div className="p-2">
          <LeadSummary conversationId={activeConversationId} />
        </div>
      </div>

      {/* Bulk Export Dialog */}
      <BulkExportDialog
        open={showBulkExport}
        onOpenChange={setShowBulkExport}
        conversations={selectedConversations}
        onComplete={handleBulkExportComplete}
      />
    </div>
  );
}
