"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Mock listing data removed


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

    // Bookmarks
    bookmarks: Listing[];
    toggleBookmark: (listing: Listing) => void;
}

const ScoutContext = createContext<ScoutContextType | undefined>(undefined);

export function ScoutProvider({ children }: { children: ReactNode }) {
    // --- State from page.tsx ---
    const [searchCity, setSearchCity] = useState("San Francisco, CA");
    const [maxBudget, setMaxBudget] = useState("3000");
    const [minBudget, setMinBudget] = useState("1500");
    const [bedrooms, setBedrooms] = useState("any");

    const [isScanning, setIsScanning] = useState(false);
    const [listings, setListings] = useState<Listing[]>([]); // Start with empty listings

    // Scout Agent State
    const [isScouting, setIsScouting] = useState(false);
    const [liveUrl, setLiveUrl] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Bookmarks State
    const [bookmarks, setBookmarks] = useState<Listing[]>([]);

    // Load from localStorage on mount (Client-side only)
    React.useEffect(() => {
        const saved = localStorage.getItem('rent-swarm-bookmarks');
        if (saved) {
            try {
                setBookmarks(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse bookmarks", e);
            }
        }
    }, []);

    // Save to localStorage on change
    React.useEffect(() => {
        localStorage.setItem('rent-swarm-bookmarks', JSON.stringify(bookmarks));
    }, [bookmarks]);

    const toggleBookmark = (listing: Listing) => {
        setBookmarks(prev => {
            const exists = prev.find(b => b.id === listing.id);
            if (exists) {
                return prev.filter(b => b.id !== listing.id);
            } else {
                return [...prev, { ...listing, savedAt: new Date().toLocaleDateString() }];
            }
        });
    };

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
            let buffer = '';

            const processLine = (line: string) => {
                if (!line.trim()) return;
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
            };

            while (true) {
                const { value, done } = await reader.read();

                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                }

                if (done) {
                    if (buffer.trim()) processLine(buffer);
                    break;
                }

                const lines = buffer.split('\n');
                // Keep the last line in the buffer as it might be incomplete
                buffer = lines.pop() || '';

                lines.forEach(processLine);
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
            bookmarks,
            isScanning,
            isScouting,
            searchCity, setSearchCity,
            minBudget, setMinBudget,
            maxBudget, setMaxBudget,
            bedrooms, setBedrooms,
            deployScout,
            toggleBookmark
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
