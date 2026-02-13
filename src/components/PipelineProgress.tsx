"use client";

import { AGENT_ORDER, AGENT_LABELS, AGENT_COLORS, type AgentName } from "@/shared/models/sdr";
import { cn } from "@/client-lib/utils";
import { Check } from "lucide-react";

export function PipelineProgress({ currentAgent }: { currentAgent: AgentName }) {
  const currentIdx = AGENT_ORDER.indexOf(currentAgent);

  return (
    <div className="flex items-center gap-1 w-full">
      {AGENT_ORDER.map((agent, idx) => {
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;
        const color = AGENT_COLORS[agent];

        return (
          <div key={agent} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-2 w-full rounded-full transition-all duration-300",
                isCompleted ? color : isActive ? cn(color, "animate-pulse") : "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/50",
              )}
            >
              {isCompleted && <Check className="h-2.5 w-2.5 inline mr-0.5" />}
              {AGENT_LABELS[agent]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
