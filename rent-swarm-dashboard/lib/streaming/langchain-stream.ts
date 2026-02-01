/**
 * Adapter to convert LangChain async generator streams to Next.js ReadableStream
 * Formats output as Server-Sent Events (SSE) or JSON chunks
 */
export class LangChainStreamAdapter {
  /**
   * Convert LangChain stream to ReadableStream for Next.js Response
   * @param stream AsyncGenerator from LangChain/LangGraph
   * @param format 'sse' for Server-Sent Events or 'json' for JSON chunks
   */
  static toReadableStream(
    stream: AsyncGenerator<any>,
    format: "sse" | "json" = "json"
  ): ReadableStream {
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of stream) {
            // Extract content from chunk
            let content = "";

            if (chunk.content) {
              content = typeof chunk.content === "string"
                ? chunk.content
                : JSON.stringify(chunk.content);
            } else if (typeof chunk === "string") {
              content = chunk;
            } else if (chunk.sessionId) {
              // From our chat agent stream
              content = chunk.content || "";
            }

            if (content) {
              // Format based on requested format
              let data: string;
              if (format === "sse") {
                // Server-Sent Events format
                data = `data: ${JSON.stringify({ type: "chunk", content })}\n\n`;
              } else {
                // JSON format
                data = JSON.stringify({ type: "chunk", content }) + "\n";
              }

              controller.enqueue(encoder.encode(data));
            }
          }

          // Send completion signal
          const completeData = format === "sse"
            ? `data: ${JSON.stringify({ type: "done" })}\n\n`
            : JSON.stringify({ type: "done" }) + "\n";

          controller.enqueue(encoder.encode(completeData));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);

          // Send error to client
          const errorData = format === "sse"
            ? `data: ${JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Stream error",
              })}\n\n`
            : JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Stream error",
              }) + "\n";

          controller.enqueue(encoder.encode(errorData));
          controller.error(error);
        }
      },
    });
  }
}
