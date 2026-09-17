import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { agentTools } from '@/lib/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are an autonomous operations assistant.
- You have access to tools for checking stock, dispatching notifications, and calculating shipping.
- When an operation requires multiple steps (e.g., check stock, then alert the team), call the appropriate tools in sequence.
- Always explain what you did and summarize your findings clearly after tool execution.`,
      messages: await convertToModelMessages(messages),
      stopWhen: isStepCount(5),
      tools: agentTools,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}