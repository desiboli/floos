import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@floos/ui/components/message-scroller";

import { useFloosChat } from "../provider";
import { ChatErrorItem, ChatMessageItem, ChatThinkingItem } from "./chat-messages";

export function ChatThread() {
  const {
    state: { messages, status, error },
  } = useFloosChat();
  const last = messages.at(-1);
  const isBusy = status === "submitted" || status === "streaming";
  const showThinking = !error && isBusy && last?.role === "user";

  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden">
      <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor" scrollPreviousItemPeek={64}>
        <MessageScroller>
          <MessageScrollerViewport
            className="[&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", scrollbarGutter: "auto" }}
          >
            <MessageScrollerContent
              aria-busy={isBusy}
              className="mx-auto w-full max-w-3xl gap-6 py-4"
            >
              {messages.map((message) => (
                <ChatMessageItem key={message.id} message={message} />
              ))}
              {showThinking ? <ChatThinkingItem /> : null}
              {error ? <ChatErrorItem message={error} /> : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}
