"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Link as LinkIcon, Search, Scale, BadgeDollarSign, TrendingUp, Zap, Activity, Bookmark, MessageSquare, Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
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
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-lg shadow-primary/10"
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

        {/* User Footer */}
        <div className="border-t border-sidebar-border p-4">
          {session ? (
            <div className="rounded-lg bg-sidebar-accent p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {session.user?.name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {session.user?.email}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-sidebar-accent p-3">
              <Button asChild className="w-full font-mono text-xs" size="sm">
                <Link href="/login">LOGIN / JOIN</Link>
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
