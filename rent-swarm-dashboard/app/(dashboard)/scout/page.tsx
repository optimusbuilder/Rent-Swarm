"use client";

import { useState } from "react";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// Mock listing data
const mockListings = [
  {
    id: 1,
    image: "/placeholder.svg?height=200&width=300",
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
    image: "/placeholder.svg?height=200&width=300",
    price: 1850,
    address: "523 Valencia St, Unit 2",
    city: "San Francisco, CA",
    beds: 1,
    baths: 1,
    sqft: 620,
    scamScore: 78,
    verified: false,
  },
  {
    id: 3,
    image: "/placeholder.svg?height=200&width=300",
    price: 3200,
    address: "2100 Pine St, #301",
    city: "San Francisco, CA",
    beds: 3,
    baths: 2,
    sqft: 1200,
    scamScore: 5,
    verified: true,
  },
  {
    id: 4,
    image: "/placeholder.svg?height=200&width=300",
    price: 1650,
    address: "891 Folsom St, Apt 12",
    city: "San Francisco, CA",
    beds: 1,
    baths: 1,
    sqft: 480,
    scamScore: 45,
    verified: false,
  },
  {
    id: 5,
    image: "/placeholder.svg?height=200&width=300",
    price: 2800,
    address: "1425 Bush St, Unit 5A",
    city: "San Francisco, CA",
    beds: 2,
    baths: 2,
    sqft: 980,
    scamScore: 8,
    verified: true,
  },
  {
    id: 6,
    image: "/placeholder.svg?height=200&width=300",
    price: 4500,
    address: "2850 Broadway, PH",
    city: "San Francisco, CA",
    beds: 4,
    baths: 3,
    sqft: 2100,
    scamScore: 92,
    verified: false,
  },
];

function getScamScoreColor(score: number) {
  if (score <= 20) return "bg-status-success text-background";
  if (score <= 50) return "bg-status-warning text-background";
  return "bg-status-danger text-foreground";
}

function getScamScoreLabel(score: number) {
  if (score <= 20) return "Low Risk";
  if (score <= 50) return "Medium Risk";
  return "High Risk";
}

export default function ScoutPage() {
  const [searchCity, setSearchCity] = useState("San Francisco, CA");
  const [maxBudget, setMaxBudget] = useState("3000");
  const [minBudget, setMinBudget] = useState("1500");
  const [bedrooms, setBedrooms] = useState("any");
  const [isScanning, setIsScanning] = useState(false);
  const [listings, setListings] = useState(mockListings);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId] = useState("8821");

  const handleDeployScout = () => {
    setIsScanning(true);
    setSessionActive(true);
    setListings([]);

    // Simulate scanning and results appearing
    setTimeout(() => {
      setListings(mockListings.slice(0, 2));
    }, 1500);
    setTimeout(() => {
      setListings(mockListings.slice(0, 4));
    }, 2500);
    setTimeout(() => {
      setListings(mockListings);
      setIsScanning(false);
    }, 3500);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel - Control Center (60%) */}
      <div className="flex w-[60%] flex-col border-r border-border">
        {/* Header with Search Controls */}
        <header className="shrink-0 border-b border-border bg-card p-4">
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
          <div className="grid grid-cols-4 gap-3">
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
            onClick={handleDeployScout}
            disabled={isScanning}
            className="mt-4 w-full font-mono text-sm h-12"
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
            <div className="flex h-full flex-col items-center justify-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-2 border-primary/30" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="mt-4 font-mono text-sm text-primary animate-pulse">
                SCANNING LISTINGS...
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Searching Zillow, Apartments.com, Craigslist...
              </p>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Search className="h-12 w-12 text-muted-foreground/50" />
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
                  className="group overflow-hidden border-border bg-card transition-all duration-300 hover:border-primary/50"
                >
                  <div className="flex">
                    {/* Thumbnail */}
                    <div className="relative h-28 w-36 shrink-0 overflow-hidden bg-secondary">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="font-mono text-[10px] text-muted-foreground">
                          [IMG]
                        </div>
                      </div>
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
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono text-lg font-bold text-foreground">
                                ${listing.price.toLocaleString()}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                /mo
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {listing.address}
                            </p>
                          </div>
                          <Badge
                            className={`font-mono text-[10px] ${getScamScoreColor(listing.scamScore)}`}
                          >
                            <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                            {listing.scamScore}%
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                          <span>{listing.beds} bed</span>
                          <span>{listing.baths} bath</span>
                          <span>{listing.sqft.toLocaleString()} sqft</span>
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="h-7 flex-1 font-mono text-[10px]"
                        >
                          <Link href={`/forecaster?listingId=${listing.id}&price=${listing.price}&address=${encodeURIComponent(listing.address)}&city=${encodeURIComponent(listing.city)}&beds=${listing.beds}&baths=${listing.baths}&sqft=${listing.sqft}`}>
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
      <div className="flex w-[40%] flex-col bg-background">
        {/* Terminal Header */}
        <header className="shrink-0 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${sessionActive ? "bg-status-danger animate-ping opacity-75" : "bg-muted-foreground"}`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${sessionActive ? "bg-status-danger" : "bg-muted-foreground"}`}
              />
            </span>
            <span className="font-mono text-sm font-bold tracking-tight text-foreground">
              LIVE AGENT VIEW
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              [Session ID: #{sessionId}]
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
          {sessionActive ? (
            <iframe
              src="about:blank"
              className="h-full w-full border-0"
              title="Browserbase Live Session"
              sandbox="allow-same-origin allow-scripts"
            />
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
  useState(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  });

  return (
    <span suppressHydrationWarning>
      {time.toLocaleDateString()} {time.toLocaleTimeString()}
    </span>
  );
}
