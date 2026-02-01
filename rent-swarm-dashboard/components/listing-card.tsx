"use client";

import Link from "next/link";
import {
    Shield,
    AlertTriangle,
    Scale,
    TrendingUp,
    BadgeDollarSign,
    Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Listing {
    id: number;
    image: string;
    price: number;
    address: string;
    city: string;
    beds: number;
    baths: number;
    sqft: number;
    scamScore: number;
    verified: boolean;
    link?: string;
    savedAt?: string; // Optional, for bookmarks page
}

interface ListingCardProps {
    listing: Listing;
    isBookmarked: boolean;
    onToggleBookmark: (listing: Listing) => void;
    showSavedDate?: boolean;
}

function getScamScoreColor(score: number) {
    if (score <= 20) return "bg-status-success text-background";
    if (score <= 50) return "bg-status-warning text-background";
    return "bg-status-danger text-foreground";
}

export function ListingCard({
    listing,
    isBookmarked,
    onToggleBookmark,
    showSavedDate = false,
}: ListingCardProps) {
    return (
        <Card className="group overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50">
            <div className="flex">
                {/* Thumbnail */}
                <div className="relative h-32 w-40 min-w-[10rem] shrink-0 overflow-hidden bg-secondary">
                    {listing.image && listing.image !== "/house-placeholder.jpg" ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={listing.image}
                            alt="Listing"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                            <div className="font-mono text-[10px] text-muted-foreground">
                                [IMG]
                            </div>
                        </div>
                    )}

                    {listing.verified && (
                        <div className="absolute left-1 top-1">
                            <Badge className="bg-status-success/90 px-1 py-0 font-mono text-[10px] text-background">
                                <Shield className="mr-0.5 h-2 w-2" />
                                OK
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content */}
                <CardContent className="flex flex-1 flex-col justify-between p-3">
                    <div>
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                                {/* Clickable Title */}
                                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                                <a
                                    href={listing.link || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group-hover:underline"
                                >
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-mono text-lg font-bold text-foreground">
                                            ${listing.price.toLocaleString()}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            /mo
                                        </span>
                                    </div>
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {listing.address}
                                    </p>
                                </a>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onToggleBookmark(listing)}
                                        className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary hover:bg-muted transition-colors"
                                    >
                                        <Heart
                                            className={cn(
                                                "h-3.5 w-3.5 transition-colors",
                                                isBookmarked
                                                    ? "fill-blue-500 text-blue-500"
                                                    : "text-muted-foreground"
                                            )}
                                        />
                                    </button>
                                    <Badge
                                        className={`shrink-0 font-mono text-[10px] ${getScamScoreColor(
                                            listing.scamScore
                                        )}`}
                                    >
                                        <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                                        {listing.scamScore}%
                                    </Badge>
                                </div>
                                {showSavedDate && listing.savedAt && (
                                    <span className="font-mono text-[9px] text-muted-foreground">
                                        {listing.savedAt}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                            <span>{listing.beds} bed</span>
                            <span>{listing.baths} bath</span>
                            <span>{(listing.sqft || 0).toLocaleString()} sqft</span>
                        </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="h-7 font-mono text-[10px]"
                        >
                            <Link href="/lawyer">
                                <Scale className="mr-1 h-3 w-3" />
                                ANALYZE
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 font-mono text-[10px] bg-transparent"
                        >
                            <Link
                                href={{
                                    pathname: '/forecaster',
                                    query: {
                                        listingId: listing.id,
                                        price: listing.price,
                                        address: listing.address,
                                        city: listing.city,
                                        beds: listing.beds,
                                        baths: listing.baths,
                                        sqft: listing.sqft
                                    }
                                }}
                            >
                                <TrendingUp className="mr-1 h-3 w-3" />
                                FORECAST
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 font-mono text-[10px] bg-transparent"
                        >
                            <Link
                                href={{
                                    pathname: '/negotiate',
                                    query: {
                                        listingId: listing.id,
                                        price: listing.price,
                                        address: listing.address,
                                        city: listing.city,
                                        beds: listing.beds,
                                        baths: listing.baths,
                                        sqft: listing.sqft
                                    }
                                }}
                            >
                                <BadgeDollarSign className="mr-1 h-3 w-3" />
                                NEGOTIATE
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}
