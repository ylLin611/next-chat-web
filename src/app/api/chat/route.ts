export async function POST(req: Request) {
  const { message } = await req.json();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      send({ mode: "custom", data: { kind: "start" } });

      const reply = `收到消息：${message}。分片吐字中…`;

      for (const ch of reply) {
        send({
          mode: "messages-tuple",
          data: {
            role: "assistant",
            content: ch,
          },
        });
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      send({ mode: "updates", data: { status: "done" } });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
