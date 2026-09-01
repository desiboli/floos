import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react";
import { createContext, use, useEffect, useRef, useState } from "react";

import { useUserSpaces } from "@/features/spaces/hooks/use-user-spaces";

import {
  AiApiError,
  createAiSession,
  refreshAiToken,
  resetAiSession,
  type AiSessionResult,
} from "./services/api";
import { aiSessionQueryOptions } from "./services/queries";
import { pickSuggestions, type FloosUIMessage } from "./types";

type FloosChatStatus = "submitted" | "streaming" | "ready" | "error";

export type FloosChatSendOptions = {
  fresh?: boolean;
};

type FloosChatState = {
  chatId: string | null;
  messages: FloosUIMessage[];
  status: FloosChatStatus;
  error: string | null;
  inputValue: string;
  suggestionsOpen: boolean;
  title: string | null;
  suggestions: string[];
  ready: boolean;
  hasMessages: boolean;
};

type FloosChatActions = {
  setInputValue: (value: string) => void;
  setSuggestionsOpen: (open: boolean) => void;
  send: (text?: string, options?: FloosChatSendOptions) => Promise<void>;
  reset: () => Promise<void>;
  stop: () => void;
  retry: () => void;
};

type FloosChatMeta = {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
};

export type FloosChatContextValue = {
  state: FloosChatState;
  actions: FloosChatActions;
  meta: FloosChatMeta;
};

type ComposerState = {
  inputValue: string;
  setInputValue: (value: string) => void;
  suggestionsOpen: boolean;
  setSuggestionsOpen: (open: boolean) => void;
  suggestions: string[];
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
};

const FloosChatContext = createContext<FloosChatContextValue | null>(null);

export function useFloosChat() {
  const value = use(FloosChatContext);
  if (!value) {
    throw new Error("FloosChat.Provider is required");
  }
  return value;
}

function titleFromMessages(messages: FloosUIMessage[], fallback: string | null) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    for (const part of message.parts) {
      if (part.type !== "data-title" || !("data" in part)) continue;
      const data = part.data as { title?: string };
      if (data.title) return data.title;
    }
  }
  return fallback;
}

function asMessages(value: unknown): FloosUIMessage[] {
  if (!Array.isArray(value)) return [];
  return value as FloosUIMessage[];
}

function clientData() {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
  };
}

function sessionErrorMessage(error: unknown) {
  if (error instanceof AiApiError && error.status === 429) {
    return "Too many requests. Try again in a moment.";
  }
  return "Couldn’t start Floos AI. Try again in a moment.";
}

export function FloosChatProvider({
  children,
  onOpen,
}: {
  children: React.ReactNode;
  onOpen?: () => void;
}) {
  const { activeSpaceId } = useUserSpaces();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery(aiSessionQueryOptions(activeSpaceId));
  const pendingQuestionRef = useRef<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions] = useState(pickSuggestions);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composer: ComposerState = {
    inputValue,
    setInputValue,
    suggestionsOpen,
    setSuggestionsOpen,
    suggestions,
    inputRef,
  };

  async function replaceSession() {
    const next = await resetAiSession();
    queryClient.setQueryData(aiSessionQueryOptions(activeSpaceId).queryKey, next);
  }

  async function ensureSession() {
    const next = await createAiSession();
    queryClient.setQueryData(aiSessionQueryOptions(activeSpaceId).queryKey, next);
  }

  useEffect(() => {
    if (!sessionQuery.isError) return;
    console.error(sessionQuery.error);
  }, [sessionQuery.error, sessionQuery.isError]);

  if (sessionQuery.data) {
    return (
      <FloosChatSession
        key={sessionQuery.data.chatId}
        session={sessionQuery.data}
        composer={composer}
        pendingQuestionRef={pendingQuestionRef}
        onOpen={onOpen}
        onReplaceSession={replaceSession}
      >
        {children}
      </FloosChatSession>
    );
  }

  if (sessionQuery.isPending || sessionQuery.isError) {
    return (
      <FloosChatIdle
        composer={composer}
        error={sessionQuery.isError ? sessionErrorMessage(sessionQuery.error) : null}
        onRetry={sessionQuery.refetch}
      >
        {children}
      </FloosChatIdle>
    );
  }

  return (
    <FloosChatNoSession
      composer={composer}
      pendingQuestionRef={pendingQuestionRef}
      onOpen={onOpen}
      onEnsureSession={ensureSession}
      onReplaceSession={replaceSession}
    >
      {children}
    </FloosChatNoSession>
  );
}

function FloosChatIdle({
  children,
  composer,
  error,
  onRetry,
}: {
  children: React.ReactNode;
  composer: ComposerState;
  error: string | null;
  onRetry: () => Promise<unknown>;
}) {
  return (
    <FloosChatContext
      value={{
        state: {
          chatId: null,
          messages: [],
          status: error ? "error" : "submitted",
          error,
          inputValue: composer.inputValue,
          suggestionsOpen: composer.suggestionsOpen,
          title: null,
          suggestions: composer.suggestions,
          ready: false,
          hasMessages: false,
        },
        actions: {
          setInputValue: composer.setInputValue,
          setSuggestionsOpen: composer.setSuggestionsOpen,
          send: async () => undefined,
          reset: async () => undefined,
          stop: () => undefined,
          retry: () => {
            void onRetry();
          },
        },
        meta: { inputRef: composer.inputRef },
      }}
    >
      {children}
    </FloosChatContext>
  );
}

function FloosChatNoSession({
  children,
  composer,
  pendingQuestionRef,
  onOpen,
  onEnsureSession,
  onReplaceSession,
}: {
  children: React.ReactNode;
  composer: ComposerState;
  pendingQuestionRef: React.RefObject<string | null>;
  onOpen?: () => void;
  onEnsureSession: () => Promise<void>;
  onReplaceSession: () => Promise<void>;
}) {
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function send(text?: string, options?: FloosChatSendOptions) {
    const value = (text ?? composer.inputValue).trim();
    if (!value) return;
    if (pendingQuestionRef.current) return;
    composer.setInputValue("");
    composer.setSuggestionsOpen(false);
    setCreateError(null);
    setCreating(true);
    pendingQuestionRef.current = value;
    try {
      await onEnsureSession();
      if (options?.fresh) onOpen?.();
    } catch (err) {
      pendingQuestionRef.current = null;
      setCreating(false);
      composer.setInputValue(value);
      setCreateError(sessionErrorMessage(err));
      console.error(err);
    }
  }

  return (
    <FloosChatContext
      value={{
        state: {
          chatId: null,
          messages: [],
          status: creating ? "submitted" : createError ? "error" : "ready",
          error: createError,
          inputValue: composer.inputValue,
          suggestionsOpen: composer.suggestionsOpen,
          title: null,
          suggestions: composer.suggestions,
          ready: true,
          hasMessages: false,
        },
        actions: {
          setInputValue: composer.setInputValue,
          setSuggestionsOpen: composer.setSuggestionsOpen,
          send,
          reset: onReplaceSession,
          stop: () => undefined,
          retry: () => undefined,
        },
        meta: { inputRef: composer.inputRef },
      }}
    >
      {children}
    </FloosChatContext>
  );
}

function FloosChatSession({
  session,
  composer,
  children,
  pendingQuestionRef,
  onOpen,
  onReplaceSession,
}: {
  session: AiSessionResult;
  composer: ComposerState;
  children: React.ReactNode;
  pendingQuestionRef: React.RefObject<string | null>;
  onOpen?: () => void;
  onReplaceSession: () => Promise<void>;
}) {
  const initialMessages = asMessages(session.messages);

  const transport = useTriggerChatTransport({
    task: "floos-agent",
    accessToken: async () => {
      const { publicAccessToken } = await refreshAiToken();
      return publicAccessToken;
    },
    startSession: async () => {
      const next = await createAiSession();
      return { publicAccessToken: next.publicAccessToken };
    },
    sessions: {
      [session.chatId]: {
        publicAccessToken: session.publicAccessToken,
        lastEventId: session.lastEventId ?? undefined,
      },
    },
    clientData: clientData(),
  });

  const { messages, sendMessage, stop, status, error } = useChat<FloosUIMessage>({
    id: session.chatId,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
  });

  const title = titleFromMessages(messages, session.title);

  useEffect(() => {
    const pending = pendingQuestionRef.current;
    if (!pending) return;
    pendingQuestionRef.current = null;
    void sendMessage({ text: pending });
  }, [session.chatId]);

  async function send(text?: string, options?: FloosChatSendOptions) {
    const value = (text ?? composer.inputValue).trim();
    if (!value) return;
    if (status === "submitted" || status === "streaming") return;
    composer.setInputValue("");
    composer.setSuggestionsOpen(false);

    if (options?.fresh && messages.length > 0) {
      pendingQuestionRef.current = value;
      await onReplaceSession();
      onOpen?.();
      return;
    }

    if (options?.fresh) onOpen?.();
    await sendMessage({ text: value });
  }

  async function reset() {
    if (status === "submitted" || status === "streaming") {
      void transport.stopGeneration(session.chatId);
      void stop();
    }
    composer.setInputValue("");
    composer.setSuggestionsOpen(false);
    await onReplaceSession();
  }

  function stopGeneration() {
    void transport.stopGeneration(session.chatId);
    void stop();
  }

  return (
    <FloosChatContext
      value={{
        state: {
          chatId: session.chatId,
          messages,
          status,
          error: error?.message ?? null,
          inputValue: composer.inputValue,
          suggestionsOpen: composer.suggestionsOpen,
          title,
          suggestions: composer.suggestions,
          ready: true,
          hasMessages: messages.length > 0,
        },
        actions: {
          setInputValue: composer.setInputValue,
          setSuggestionsOpen: composer.setSuggestionsOpen,
          send,
          reset,
          stop: stopGeneration,
          retry: () => undefined,
        },
        meta: { inputRef: composer.inputRef },
      }}
    >
      {children}
    </FloosChatContext>
  );
}
