"use client";

import { AGENT_LABELS, AGENT_COLORS, type AgentName } from "@/shared/models/sdr";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/client-lib/utils";
import { Radar, ClipboardCheck, Flame, Target, Cpu } from "lucide-react";

const AGENT_ICONS: Record<AgentName, React.ElementType> = {
  scout: Radar,
  qualifier: ClipboardCheck,
  challenger: Flame,
  closer: Target,
  coordinator: Cpu,
};

export function AgentBadge({ agent, size = "sm" }: { agent: AgentName; size?: "sm" | "lg" }) {
  const Icon = AGENT_ICONS[agent];
  const label = AGENT_LABELS[agent];
  const color = AGENT_COLORS[agent];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium border-none text-white",
        color,
        size === "lg" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5",
      )}
    >
      <Icon className={size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {label}
    </Badge>
  );
}
