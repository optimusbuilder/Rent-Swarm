"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import { Zap, Paperclip, Send, FileText, Home, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useScoutContext } from "@/app/context/scout-context";

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hello! I'm the Rent-Swarm Brain. I have context on all your searches, saved listings, and analyzed leases. How can I assist you today?",
    timestamp: new Date(Date.now() - 60000),
  },
];

export default function ChatPage() {
  const { listings, bookmarks } = useScoutContext();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contextItems = [
    { icon: Home, label: `${listings.length} Listings`, color: "text-primary" },
    { icon: Scale, label: `${bookmarks.length} Saved`, color: "text-status-success" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    console.log("Here are the new messages: ");
    console.log(JSON.stringify(newMessages.map(m => ({ role: m.role, content: m.content }))));

    try {
      // Call the API with conversation history and context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: { listings, bookmarks }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: newMessages.length + 1,
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error("API failed");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: newMessages.length + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header with Context Badge */}
      <header className="shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-mono text-lg font-bold tracking-tight">
                SWARM CHAT
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground">
                General Assistant
              </p>
            </div>
          </div>

          {/* Context Active Badge */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Context Active
            </span>
            <div className="h-4 w-px bg-border" />
            {contextItems.map((item) => (
              <Badge
                key={item.label}
                variant="outline"
                className="gap-1 border-border bg-transparent font-mono text-[10px]"
              >
                <item.icon className={cn("h-3 w-3", item.color)} />
                {item.label}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              {message.role === "assistant" ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <span className="font-mono text-xs font-bold">U</span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p
                  className={cn(
                    "mt-1 font-mono text-[10px]",
                    message.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                  <span
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border bg-card p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            {/* Attach Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 bg-transparent"
            >
              <Paperclip className="h-4 w-4" />
              <span className="sr-only">Attach file</span>
            </Button>

            {/* Input */}
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Ask the Rent-Swarm Brain anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-10 pr-12 font-mono text-sm bg-secondary border-border"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 bg-transparent font-mono text-[10px]"
              onClick={() =>
                setInput("Compare my saved listings by price per sqft")
              }
            >
              <FileText className="mr-1.5 h-3 w-3" />
              Compare Listings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 bg-transparent font-mono text-[10px]"
              onClick={() =>
                setInput("Summarize the red flags in my analyzed lease")
              }
            >
              <Scale className="mr-1.5 h-3 w-3" />
              Lease Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 bg-transparent font-mono text-[10px]"
              onClick={() =>
                setInput("What's the rent trend in my target neighborhoods?")
              }
            >
              <Home className="mr-1.5 h-3 w-3" />
              Market Trends
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
