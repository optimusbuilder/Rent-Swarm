"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Mock listing data (still used as initial state or fallback)
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
}

interface ScoutContextType {
    // Data State
    listings: Listing[];
    logs: string[];
    screenshot: string | null;
    liveUrl: string | null;
    sessionId: string | null;

    // UI State
    isScanning: boolean;
    isScouting: boolean;

    // Search Params State
    searchCity: string;
    setSearchCity: (c: string) => void;
    minBudget: string;
    setMinBudget: (s: string) => void;
    maxBudget: string;
    setMaxBudget: (s: string) => void;
    bedrooms: string;
    setBedrooms: (s: string) => void;

    // Actions
    deployScout: () => Promise<void>;
}

const ScoutContext = createContext<ScoutContextType | undefined>(undefined);

export function ScoutProvider({ children }: { children: ReactNode }) {
    // --- State from page.tsx ---
    const [searchCity, setSearchCity] = useState("San Francisco, CA");
    const [maxBudget, setMaxBudget] = useState("3000");
    const [minBudget, setMinBudget] = useState("1500");
    const [bedrooms, setBedrooms] = useState("any");

    const [isScanning, setIsScanning] = useState(false);
    const [listings, setListings] = useState<Listing[]>(mockListings); // Persist existing listings

    // Scout Agent State
    const [isScouting, setIsScouting] = useState(false);
    const [liveUrl, setLiveUrl] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // --- Logic from page.tsx ---
    const deployScout = async () => {
        setIsScouting(true);
        setIsScanning(true);
        setLogs([]); // Clear logs on new run
        setLiveUrl(null);
        setScreenshot(null);
        setSessionId(null);
        // Don't clear listings immediately, let them be replaced when new ones come

        try {
            const response = await fetch('/api/scout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    city: searchCity,
                    price: Number(maxBudget),
                    beds: bedrooms === "any" ? 2 : Number(bedrooms)
                }),
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        if (data.type === 'init') {
                            setLiveUrl(data.liveUrl);
                            setSessionId(data.sessionId);
                            setLogs(prev => [...prev, `Session Started: ${data.sessionId}`]);

                        } else if (data.type === 'log') {
                            setLogs(prev => [...prev, data.message]);

                        } else if (data.type === 'error') {
                            setLogs(prev => [...prev, `Error: ${data.message}`]);

                        } else if (data.type === 'complete') {
                            setLogs(prev => [...prev, data.message]);
                            setIsScanning(false); // Stop scanning spinner when complete

                        } else if (data.type === 'listings') {
                            setLogs(prev => [...prev, `Received ${data.data.length} listings from agent`]);

                            // Sort and format listings
                            const sorted = data.data.sort((a: any, b: any) => a.scamScore - b.scamScore);

                            // We use "any" casting effectively because API return type is loose
                            setListings(sorted.map((l: any) => ({
                                ...l,
                                // Use the custom house placeholder since we aren't scraping images
                                image: l.image && l.image.length > 5 ? l.image : "/house-placeholder.jpg",
                            })));

                        } else if (data.type === 'screenshot') {
                            setScreenshot(data.data);
                        }
                    } catch (e) {
                        console.error("Error parsing stream:", e);
                    }
                }
            }

        } catch (error) {
            console.error("Scouting failed:", error);
            setLogs(prev => [...prev, "Failed to start scouting agent."]);
            setIsScanning(false);
        }
    };

    return (
        <ScoutContext.Provider value={{
            listings,
            logs,
            screenshot,
            liveUrl,
            sessionId,
            isScanning,
            isScouting,
            searchCity, setSearchCity,
            minBudget, setMinBudget,
            maxBudget, setMaxBudget,
            bedrooms, setBedrooms,
            deployScout
        }}>
            {children}
        </ScoutContext.Provider>
    );
}

export function useScoutContext() {
    const context = useContext(ScoutContext);
    if (context === undefined) {
        throw new Error('useScoutContext must be used within a ScoutProvider');
    }
    return context;
}
