import { Bubble, BubbleContent } from "@floos/ui/components/bubble";
import { Message, MessageContent } from "@floos/ui/components/message";
import {
  MessageScrollerItem,
} from "@floos/ui/components/message-scroller";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { FloosUIMessage } from "../types";
import { EntityLink } from "./entity-link";
import { ThinkingIndicator, ToolProgress } from "./tool-progress";

function textFromMessage(message: FloosUIMessage) {
  return message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("");
}

function AssistantMarkdown({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div className="max-w-none text-sm leading-relaxed [&_a]:font-medium [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_table]:my-3 [&_table]:w-full [&_table]:text-left [&_td]:border-b [&_td]:border-border/60 [&_td]:py-1.5 [&_td]:pr-3 [&_th]:border-b [&_th]:border-border [&_th]:py-1.5 [&_th]:pr-3 [&_th]:font-medium [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => <EntityLink href={href}>{children}</EntityLink>,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

export function ChatMessageItem({ message }: { message: FloosUIMessage }) {
  if (message.role === "system") return null;

  if (message.role === "user") {
    const text = textFromMessage(message);
    return (
      <MessageScrollerItem messageId={message.id} scrollAnchor>
        <Message align="end">
          <MessageContent>
            <Bubble align="end">
              <BubbleContent>{text}</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageScrollerItem>
    );
  }

  const text = textFromMessage(message);

  return (
    <MessageScrollerItem messageId={message.id}>
      <Message align="start">
        <MessageContent>
          <ToolProgress parts={message.parts} />
          {text ? (
            <Bubble variant="ghost" align="start">
              <BubbleContent>
                <AssistantMarkdown text={text} />
              </BubbleContent>
            </Bubble>
          ) : null}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

export function ChatThinkingItem() {
  return (
    <MessageScrollerItem messageId="thinking">
      <Message align="start">
        <MessageContent>
          <ThinkingIndicator />
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

export function ChatErrorItem({ message }: { message: string }) {
  return (
    <MessageScrollerItem messageId="error">
      <Message align="start">
        <MessageContent>
          <p className="text-sm text-destructive">{message}</p>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}
