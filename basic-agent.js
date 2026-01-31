import 'dotenv/config'
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GEMINI_API_KEY,
})

export { llm }
