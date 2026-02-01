
"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceCommandInputProps {
    onCommandParsed: (filters: any) => void;
    className?: string;
}

export function VoiceCommandInput({ onCommandParsed, className }: VoiceCommandInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                await processAudio(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access denied:", error);
            alert("Microphone access required for voice commands.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob);

            const response = await fetch("/api/scout/voice-command", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Voice processing failed");
            }

            const data = await response.json();
            if (data.filters) {
                onCommandParsed(data.filters);
            }
        } catch (error) {
            console.error("Voice command error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={cn("h-9 w-9 shrink-0 transition-all duration-300", className)}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            title="Voice Command"
        >
            {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : isRecording ? (
                <Square className="h-4 w-4" />
            ) : (
                <Mic className="h-4 w-4" />
            )}
            <span className="sr-only">Voice Command</span>
        </Button>
    );
}
