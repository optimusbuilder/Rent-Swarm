"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  DollarSign,
  AlertTriangle,
  Shield,
  Scale,
  BadgeDollarSign,
  Bed,
  Monitor,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useScoutContext } from "@/app/context/scout-context";

// Mock listing data (optional fallback)
const mockListings = [
  {
    id: 1,
    image: "/house-placeholder.jpg",
    price: 2450,
    address: "1847 Market St, Apt 4B",
    city: "San Francisco, CA",
    beds: 2,
    baths: 1,
    sqft: 850,
    scamScore: 12,
    verified: true,
  },
  {
    id: 2,
    image: "/house-placeholder.jpg",
    price: 1850,
    address: "523 Valencia St, Unit 2",
    city: "San Francisco, CA",
    beds: 1,
    baths: 1,
    sqft: 620,
    scamScore: 78,
    verified: false,
  },
];

function getScamScoreColor(score: number) {
  if (score <= 20) return "bg-status-success text-background";
  if (score <= 50) return "bg-status-warning text-background";
  return "bg-status-danger text-foreground";
}

export default function ScoutPage() {
  const {
    listings,
    isScanning,
    isScouting,
    logs,
    screenshot,
    liveUrl,
    sessionId,
    searchCity, setSearchCity,
    minBudget, setMinBudget,
    maxBudget, setMaxBudget,
    bedrooms, setBedrooms,
    deployScout
  } = useScoutContext();

  // Note: All local state has been moved to ScoutContext for persistence.

  return (
    <div className="flex h-screen overflow-hidden flex-col lg:flex-row">
      {/* Left Panel - Control Center (60%) */}
      <div className="flex w-full lg:w-[60%] flex-col border-r border-border">
        {/* Header with Search Controls */}
        <header className="shrink-0 border-b border-border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <h1 className="font-mono text-lg font-bold tracking-tight">
              THE SCOUT
            </h1>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              CONTROL CENTER
            </span>
          </div>

          {/* Search Inputs Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="City / Zip"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-10 font-mono text-sm bg-secondary border-border"
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Min $"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="pl-10 font-mono text-sm bg-secondary border-border"
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Max $"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="pl-10 font-mono text-sm bg-secondary border-border"
              />
            </div>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className="font-mono text-sm bg-secondary border-border">
                <Bed className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Beds</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deploy Button */}
          <Button
            onClick={deployScout}
            disabled={isScanning}
            className="mt-4 w-full font-mono text-sm h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isScanning ? (
              <>
                <span className="mr-2 h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                SCANNING...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                DEPLOY SCOUT
              </>
            )}
          </Button>
        </header>

        {/* Stats Bar */}
        <div className="shrink-0 border-b border-border bg-background px-4 py-2">
          <div className="flex items-center gap-6 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Found:</span>
              <span className="font-bold text-foreground">{listings.length}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
              <span className="text-muted-foreground">Verified:</span>
              <span className="font-bold text-status-success">
                {listings.filter((l) => l.verified).length}
              </span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-status-danger" />
              <span className="text-muted-foreground">High Risk:</span>
              <span className="font-bold text-status-danger">
                {listings.filter((l) => l.scamScore > 50).length}
              </span>
            </div>
          </div>
        </div>

        {/* Results Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {isScanning && listings.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-2 border-primary/30" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-primary/20 border-r-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <p className="mt-4 font-mono text-sm text-primary animate-pulse">
                SCANNING LISTINGS...
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Searching Craigslist...
              </p>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center animate-in fade-in duration-500">
              <div className="relative">
                <Search className="h-12 w-12 text-muted-foreground/50 animate-pulse" />
                <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-primary/20 animate-ping" />
              </div>
              <p className="mt-4 font-mono text-sm text-muted-foreground">
                No listings yet
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground/70">
                Configure your search and deploy the scout
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {listings.map((listing) => (
                <Card
                  key={listing.id}
                  className="group overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div className="flex">
                    {/* Thumbnail */}
                    <div className="relative h-28 w-36 shrink-0 overflow-hidden bg-secondary">
                      {listing.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={listing.image}
                          alt="Listing"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="font-mono text-[10px] text-muted-foreground">
                            [IMG]
                          </div>
                        </div>
                      )}

                      {listing.verified && (
                        <div className="absolute left-1 top-1">
                          <Badge className="bg-status-success/90 font-mono text-[10px] px-1 py-0 text-background">
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
                            {/* Make title clickable */}
                            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                            <a href={(listing as any).link || '#'} target="_blank" rel="noreferrer" className="group-hover:underline">
                              <div className="flex items-baseline gap-1">
                                <span className="font-mono text-lg font-bold text-foreground">
                                  ${listing.price.toLocaleString()}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  /mo
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground truncate">
                                {listing.address}
                              </p>
                            </a>
                          </div>
                          <Badge
                            className={`font-mono text-[10px] ${getScamScoreColor(listing.scamScore)} shrink-0`}
                          >
                            <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                            {listing.scamScore}%
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                          <span>{listing.beds} bed</span>
                          <span>{listing.baths} bath</span>
                          <span>{(listing.sqft || 0).toLocaleString()} sqft</span>
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="h-7 flex-1 font-mono text-[10px]"
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
                          className="h-7 flex-1 font-mono text-[10px] bg-transparent"
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
                          className="h-7 flex-1 font-mono text-[10px] bg-transparent"
                        >
                          <Link href="/negotiate">
                            <BadgeDollarSign className="mr-1 h-3 w-3" />
                            NEGOTIATE
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Live Agent View (40%) */}
      <div className="flex w-full lg:w-[40%] flex-col bg-background border-t lg:border-t-0 border-border">
        {/* Terminal Header */}
        <header className="shrink-0 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${isScanning || isScouting ? "bg-status-danger animate-ping opacity-75" : "bg-muted-foreground"}`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isScanning || isScouting ? "bg-status-danger" : "bg-muted-foreground"}`}
              />
            </span>
            <span className="font-mono text-sm font-bold tracking-tight text-foreground">
              LIVE AGENT VIEW
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {sessionId ? `[Session ID: #${sessionId.slice(0, 8)}]` : "[OFFLINE]"}
            </span>
            <Monitor className="ml-auto h-4 w-4 text-muted-foreground" />
          </div>
        </header>

        {/* Live Feed Container */}
        <div className="relative flex-1 overflow-hidden bg-[oklch(0.08_0.01_260)]">
          {/* Corner Brackets */}
          <div className="pointer-events-none absolute inset-4 z-10">
            {/* Top Left */}
            <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-primary/60" />
            {/* Top Right */}
            <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-primary/60" />
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-primary/60" />
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-primary/60" />
          </div>

          {/* Scanlines Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-20 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
            }}
          />

          {/* Timestamp Overlay */}
          <div className="absolute bottom-4 right-4 z-30 font-mono text-[10px] text-primary/70">
            <TimestampDisplay />
          </div>

          {/* Iframe or Placeholder */}
          {isScouting ? (
            <div className="flex flex-col h-full z-40 relative">
              {screenshot ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`data:image/png;base64,${screenshot}`}
                  alt="Live Agent View"
                  className="flex-1 w-full object-contain bg-black"
                />
              ) : liveUrl ? (
                <iframe
                  src={liveUrl}
                  className="flex-1 w-full border-0"
                  allow="clipboard-read; clipboard-write"
                  title="Live Agent View"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-b border-white/10">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="mt-4 font-mono text-sm text-primary">CONNECTING TO AGENT...</p>
                </div>
              )}

              {/* Logs Console */}
              <div className="h-48 shrink-0 overflow-y-auto bg-black p-4 font-mono text-[10px] text-green-400 border-t border-white/10 z-40">
                <div className="mb-2 text-white/50 border-b border-white/10 pb-1">AGENT LOGS</div>
                {logs.length === 0 && <span className="opacity-50">Waiting for logs...</span>}
                {logs.map((log, i) => (
                  <div key={i} className="mb-1 break-all">
                    <span className="mr-2 text-white/30">{new Date().toLocaleTimeString()}</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border border-muted-foreground/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-muted-foreground/40" />
                </div>
              </div>
              <p className="mt-6 font-mono text-sm text-muted-foreground">
                Agent Standby...
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground/60">
                Waiting for targets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimestampDisplay() {
  const [time, setTime] = useState(new Date());

  // biome-ignore lint/correctness/useExhaustiveDependencies: interval timer
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span suppressHydrationWarning>
      {time.toLocaleDateString()} {time.toLocaleTimeString()}
    </span>
  );
}
