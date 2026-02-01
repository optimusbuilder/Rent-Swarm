"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Square, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoicePlayerProps {
    text: string;
    voiceId?: string; // Optional: Override default voice
    className?: string;
    autoPlay?: boolean;
}

export function VoicePlayer({ text, voiceId, className, autoPlay = false }: VoicePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const handlePlayClick = async () => {
        if (isPlaying) {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0; // Reset
            setIsPlaying(false);
            return;
        }

        // If we already have the audio, just play it
        if (audioUrl) {
            try {
                await audioRef.current?.play();
                setIsPlaying(true);
            } catch (e) {
                console.error("Playback error", e);
            }
            return;
        }

        // Fetch new audio
        setIsLoading(true);
        try {
            const response = await fetch("/api/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voiceId }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate speech");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

            // Need to wait for ref to update with new src? 
            // Actually we can just play directly after setting state or using a new Audio obj
            // But using the ref allows us to attach event listeners more easily in JSX

            // Let's rely on the useEffect below or just force it here slightly later
            // A cleaner way is to let the <audio> tag handle the src
        } catch (error) {
            console.error("Voice fetch error:", error);
            // Optional: Toast error here
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-play when audioUrl becomes available (if triggered by user click flow)
    useEffect(() => {
        if (audioUrl && audioRef.current && !isPlaying && !isLoading) {
            // Verify we aren't already playing (though logic separates them)
            const playAudio = async () => {
                try {
                    await audioRef.current?.play();
                    setIsPlaying(true);
                } catch (e) {
                    console.error("Autoplay failed", e);
                }
            };
            playAudio();
        }
    }, [audioUrl, isLoading]);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                variant="outline"
                size="sm"
                onClick={handlePlayClick}
                disabled={isLoading || !text}
                className={cn(
                    "gap-2 font-mono text-xs transition-all",
                    isPlaying && "border-primary text-primary bg-primary/5"
                )}
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isPlaying ? (
                    <Square className="h-3.5 w-3.5 fill-current" />
                ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                )}
                {isLoading ? "GENERATING..." : isPlaying ? "STOP VOICE" : "READ ALOUD"}
            </Button>

            {/* Hidden Audio Element */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    onError={() => setIsPlaying(false)}
                    className="hidden"
                />
            )}
        </div>
    );
}
