import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { agentTools } from '@/lib/tools';
import { createClient, createServiceRoleClient } from '@/lib/db/server';
import { CONFIG } from '@/lib/config';
import { z } from 'zod';

export const maxDuration = 60;

const requestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(30),
  taskId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  let taskId: string | undefined;

  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: 'Invalid agent request.' }, { status: 400 });
    }

    const { messages, taskId: parsedTaskId } = parsed.data as {
      messages: UIMessage[];
      taskId?: string;
    };
    taskId = parsedTaskId;

    if (taskId) {
      const { error } = await serviceClient
        .from('tasks')
        .update({ status: 'running' })
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (error) {
        console.error('Unable to mark task as in progress:', error.message);
      }
    }

    const result = streamText({
      model: google(CONFIG.AI_MODEL),
      system: `You are an autonomous operations assistant.
- You have access to tools for checking stock, dispatching notifications, and calculating shipping.
- When an operation requires multiple steps (e.g., check stock, then alert the team), call the appropriate tools in sequence.
- Always explain what you did and summarize your findings clearly after tool execution.`,
      messages: await convertToModelMessages(messages),
      stopWhen: isStepCount(5),
      tools: agentTools,
      onFinish: async ({ finishReason }) => {
        if (!taskId) return;
        const { error } = await serviceClient
          .from('tasks')
          .update({
            status: finishReason === 'error' ? 'failed' : 'completed',
          })
          .eq('id', taskId)
          .eq('user_id', user.id);
        if (error) {
          console.error('Unable to update task status:', error.message);
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error: unknown) {
    if (taskId) {
      const { error: updateError } = await serviceClient
        .from('tasks')
        .update({ status: 'failed' })
        .eq('id', taskId)
        .eq('user_id', user.id);
      if (updateError) {
        console.error('Unable to mark failed task:', updateError.message);
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    const isQuotaError =
      message.includes('insufficient_quota') ||
      message.includes('credit_balance_exhausted') ||
      message.includes('RESOURCE_EXHAUSTED');

    console.error('Agent request failed:', error);
    return new Response(JSON.stringify({ error: 'The agent could not complete this request.' }), {
      status: isQuotaError ? 402 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}