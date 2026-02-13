"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentBadge } from "@/components/AgentBadge";
import { PipelineProgress } from "@/components/PipelineProgress";
import { useSdrChat } from "@/hooks/use-sdr-chat";
import type { AgentName, SdrMessage } from "@/shared/models/sdr";
import { cn } from "@/client-lib/utils";

function MessageBubble({ message }: { message: SdrMessage }) {
  const isUser = message.role === "user";
  const isCoordinatorJson = message.agent === "coordinator" && message.content.includes("{");

  return (
    <div className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
      <div className="flex flex-col gap-1 min-w-0">
        {!isUser && message.agent && (
          <AgentBadge agent={message.agent as AgentName} />
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : isCoordinatorJson
                ? "bg-muted font-mono text-xs whitespace-pre-wrap rounded-bl-md overflow-x-auto"
                : "bg-muted rounded-bl-md",
          )}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

export function ChatView({ conversationId }: { conversationId: string | null }) {
  const { conversation, messages, isProcessing, sendMessage } = useSdrChat(conversationId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing || !conversationId) return;
    setInput("");
    await sendMessage(trimmed);
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">No conversation selected</p>
          <p className="text-sm">Create a new conversation or select one from the sidebar.</p>
        </div>
      </div>
    );
  }

  const isCompleted = conversation?.status === "completed";
  const isDisqualified = conversation?.status === "disqualified";

  return (
    <div className="flex flex-col h-full">
      {conversation && (
        <div className="px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
          <PipelineProgress currentAgent={conversation.current_agent} />
          {isCompleted && (
            <div className="mt-2 text-center">
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                \u2713 Pipeline Complete
              </span>
            </div>
          )}
          {isDisqualified && (
            <div className="mt-2 text-center">
              <span className="text-xs font-medium text-red-500 bg-red-500/10 px-3 py-1 rounded-full">
                \u2717 Lead Disqualified
              </span>
            </div>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {messages.length === 0 && !isProcessing && (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">\ud83c\udfaf</div>
              <p className="text-sm text-muted-foreground">
                Start by telling the Scout what you&apos;re looking for.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isProcessing && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <Card className="border-none shadow-none bg-muted">
                <CardContent className="p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {conversation?.current_agent
                      ? `${conversation.current_agent.charAt(0).toUpperCase() + conversation.current_agent.slice(1)} is thinking...`
                      : "Processing..."}
                  </span>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isCompleted
                ? "Conversation complete"
                : isDisqualified
                  ? "Lead disqualified"
                  : "Type your message..."
            }
            disabled={isProcessing || isCompleted || isDisqualified}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isProcessing || isCompleted || isDisqualified}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
