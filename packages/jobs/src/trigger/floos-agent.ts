import { resolveFloosAgentContext } from "@floos/ai/context";
import { buildSystemPrompt, floosAgentClientDataSchema, type FloosUIMessage } from "@floos/ai";
import { createFloosTools } from "@floos/ai/tools";
import { db } from "@floos/db";
import { getAiChatById, persistAiTurn, type AiMessagePayload } from "@floos/db/queries";
import { env } from "@floos/env/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { logger } from "@trigger.dev/sdk";
import { chat } from "@trigger.dev/sdk/ai";
import { generateText, stepCountIs, streamText, type UIMessage } from "ai";

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
  compatibility: "strict",
  appName: "Floos",
  appUrl: env.CORS_ORIGIN,
});

const agentModel = openrouter("openai/gpt-4.1-mini");
const titleModel = openrouter("openai/gpt-4o-mini");

const agentContext = chat.local<{ current: NonNullable<Awaited<ReturnType<typeof resolveFloosAgentContext>>> }>({
  id: "floos-agent-context",
});

function toMessagePayloads(messages: UIMessage[]): AiMessagePayload[] {
  return messages.map((message) => ({
    ...message,
    id: message.id,
    role: message.role,
  }));
}

function userMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
}

async function generateChatTitle(text: string): Promise<string | null> {
  try {
    const { text: title } = await generateText({
      model: titleModel,
      temperature: 0,
      prompt: `Generate a 3-5 word title for this household finance chat. No quotes, no punctuation, no emojis.\n\n${text.slice(0, 400)}`,
    });
    const cleaned = title.trim().replace(/^["']|["']$/g, "").slice(0, 80);
    return cleaned.length > 0 ? cleaned : null;
  } catch (error) {
    logger.warn("Failed to generate chat title", { error });
    return null;
  }
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function sanitizeStreamError(error: unknown): string {
  logger.error("Floos agent stream error", { error });
  const message = errorText(error).toLowerCase();
  if (message.includes("quota") || message.includes("rate limit") || message.includes("resource exhausted")) {
    return "The AI provider is out of quota right now. Check your OpenRouter credits and try again in a few minutes.";
  }
  return "Something went wrong. Please try again.";
}

export const floosAgent = chat
  .withUIMessage<FloosUIMessage>({
    streamOptions: {
      onError: sanitizeStreamError,
    },
  })
  .withClientData({
    schema: floosAgentClientDataSchema,
  })
  .agent({
    id: "floos-agent",
    tools: () => createFloosTools(agentContext.current),
    onBoot: async ({ chatId, clientData }) => {
      const ctx = await resolveFloosAgentContext({
        chatId,
        timezone: clientData?.timezone,
        locale: clientData?.locale,
      });
      if (!ctx) {
        throw new Error("Chat not found or access denied");
      }
      agentContext.init({ current: ctx });
    },
    onTurnStart: async ({ chatId, uiMessages, writer }) => {
      const row = await getAiChatById(db, chatId);
      let title: string | null | undefined;

      if (!row?.title) {
        const firstUser = uiMessages.find((message) => message.role === "user");
        const text = firstUser ? userMessageText(firstUser) : "";
        if (text) {
          title = await generateChatTitle(text);
          if (title) {
            writer.write({ type: "data-title", data: { title } });
          }
        }
      }

      await persistAiTurn(db, {
        chatId,
        messages: toMessagePayloads(uiMessages),
        ...(title ? { title } : {}),
      });
    },
    onTurnComplete: async ({ chatId, uiMessages, lastEventId }) => {
      const row = await getAiChatById(db, chatId);
      await persistAiTurn(db, {
        chatId,
        messages: toMessagePayloads(uiMessages),
        lastEventId: lastEventId ?? null,
        title: row?.title ?? undefined,
      });
    },
    run: async ({ messages, tools, signal }) => {
      chat.prompt.set(buildSystemPrompt(agentContext.current));

      return streamText({
        ...chat.toStreamTextOptions({ tools }),
        model: agentModel,
        messages,
        abortSignal: signal,
        stopWhen: stepCountIs(6),
      });
    },
  });
