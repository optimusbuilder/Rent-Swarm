
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry } from "@/lib/utils/retry";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as Blob;

        if (!audioFile) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 }
            );
        }

        const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
        const googleKey = process.env.GOOGLE_API_KEY;

        if (!elevenLabsKey || !googleKey) {
            return NextResponse.json(
                { error: "Server configuration error: Missing API keys" },
                { status: 500 }
            );
        }

        // 1. Transcribe with ElevenLabs (Scribe)
        const elevenLabsFormData = new FormData();
        elevenLabsFormData.append("file", audioFile);
        elevenLabsFormData.append("model_id", "scribe_v1");
        // tag_audio_events=true can be useful but optional, keeping simple for now

        const transcriptionResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
            method: "POST",
            headers: {
                "xi-api-key": elevenLabsKey,
            },
            body: elevenLabsFormData,
        });

        if (!transcriptionResponse.ok) {
            const errorText = await transcriptionResponse.text();
            console.error("ElevenLabs STT Error:", errorText);
            return NextResponse.json(
                { error: "Failed to transcribe audio" },
                { status: transcriptionResponse.status }
            );
        }

        const transcriptionData = await transcriptionResponse.json();
        const transcribedText = transcriptionData.text;

        if (!transcribedText) {
            return NextResponse.json({ text: "", filters: {} });
        }

        // 2. Parse Intent with Gemini
        const genAI = new GoogleGenerativeAI(googleKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
      You are a search assistant for a rental property dashboard.
      Extract search filters from the following user command: "${transcribedText}"
      
      Return a JSON object with these keys (use null if not mentioned):
      - city: string (e.g. "San Francisco, CA") naming the location.
      - minBudget: number (e.g. 1000).
      - maxBudget: number (e.g. 3000).
      - bedrooms: string (e.g. "2" or "any"). If they say "studio", return "0" or "studio" but map to "1" or similar if needed. Let's return the string value to match select options: "1", "2", "3", "4", "any".
      
      Example Input: "I want a 2 bed in Austin under 2 grand"
      Example Output: { "city": "Austin, TX", "minBudget": null, "maxBudget": 2000, "bedrooms": "2" }
    `;

        // Use exponential backoff retry for rate limiting (429 errors)
        const result = await withRetry(
          async () => model.generateContent(prompt),
          {
            maxRetries: 5,
            initialDelayMs: 1000,
            onRetry: (error, attempt, delayMs) => {
              console.log(`[VoiceCommand] Retry attempt ${attempt} after ${delayMs}ms due to: ${error.message}`);
            }
          }
        );
        const filters = JSON.parse(result.response.text());

        return NextResponse.json({
            text: transcribedText,
            filters: filters
        });

    } catch (error) {
        console.error("Voice command error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
