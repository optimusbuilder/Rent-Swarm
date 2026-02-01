
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text, voiceId } = await req.json();

        if (!text) {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            );
        }

        const API_KEY = process.env.ELEVENLABS_API_KEY;
        if (!API_KEY) {
            return NextResponse.json(
                { error: "ElevenLabs API key not configured" },
                { status: 500 }
            );
        }

        // Default voice: "Charlotte" (gentle, professional) or a fallback if not provided
        // "21m00Tcm4TlvDq8ikWAM" is "Rachel" - widely used, reliable default
        const finalVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM";

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": API_KEY,
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs API Error:", errorText);
            return NextResponse.json(
                { error: "Failed to generate speech" },
                { status: response.status }
            );
        }

        // Return the audio stream directly
        const audioBlob = await response.blob();
        return new NextResponse(audioBlob, {
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });

    } catch (error) {
        console.error("Voice generation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
