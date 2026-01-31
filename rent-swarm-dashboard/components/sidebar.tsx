"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link as LinkIcon, Search, Scale, BadgeDollarSign, TrendingUp, Zap, Activity, Bookmark, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "The Scout",
    href: "/scout",
    icon: Search,
    description: "Search + Live View",
  },
  {
    name: "The Lawyer",
    href: "/lawyer",
    icon: Scale,
    description: "Compliance",
  },
  {
    name: "The Forecaster",
    href: "/forecaster",
    icon: TrendingUp,
    description: "Financials",
  },
  {
    name: "The Haggler",
    href: "/negotiate",
    icon: BadgeDollarSign,
    description: "Negotiation",
  },
  {
    name: "Bookmarks",
    href: "/bookmarks",
    icon: Bookmark,
    description: "Saved Listings",
  },
  {
    name: "Chats",
    href: "/chat",
    icon: MessageSquare,
    description: "Agent History",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-mono text-lg font-bold tracking-tight text-sidebar-foreground">
            RENT-SWARM
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Command Center
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Agents
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-muted-foreground group-hover:text-sidebar-foreground"
                )}
              />
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {item.description}
                </span>
              </div>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-status-active animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              System Status
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-status-success animate-pulse" />
              <span className="font-mono text-xs text-status-success">
                ONLINE
              </span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-foreground">
              4
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              agents active
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
