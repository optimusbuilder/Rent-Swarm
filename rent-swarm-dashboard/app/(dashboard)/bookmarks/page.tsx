"use client";

import {
  Bookmark,
  Search,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useScoutContext } from "@/app/context/scout-context";
import { ListingCard } from "@/components/listing-card";

export default function BookmarksPage() {
  const { bookmarks, toggleBookmark } = useScoutContext();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bookmark className="h-5 w-5 text-primary" />
            <div>
              <h1 className="font-mono text-lg font-bold tracking-tight">
                BOOKMARKS
              </h1>
              <p className="font-mono text-xs text-muted-foreground">
                Your saved listings shortlist
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Saved:</span>
              <span className="font-bold text-foreground">{bookmarks.length}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
              <span className="text-muted-foreground">Verified:</span>
              <span className="font-bold text-status-success">
                {bookmarks.filter((b) => b.verified).length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {bookmarks.length === 0 ? (
          /* Empty State */
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border border-muted-foreground/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Bookmark className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </div>
            <h2 className="mt-6 font-mono text-lg font-bold text-foreground">
              No saved listings
            </h2>
            <p className="mt-2 max-w-sm font-mono text-sm text-muted-foreground">
              Start searching for apartments and save your favorites to build your shortlist.
            </p>
            <Button asChild className="mt-6 font-mono">
              <Link href="/scout">
                <Search className="mr-2 h-4 w-4" />
                GO TO SCOUT
              </Link>
            </Button>
          </div>
        ) : (
          /* Listings Grid */
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {bookmarks.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isBookmarked={true} // Always true on bookmarks page
                onToggleBookmark={toggleBookmark} // Allows removing from here
                showSavedDate={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
