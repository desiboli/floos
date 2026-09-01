import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@floos/ui/components/tooltip";

import { useFloosChat } from "../provider";
import { ChatReplyInput } from "./ask-floos-input";
import { ChatThread } from "./chat-thread";

export function ChatView({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">{children}</div>
  );
}

export function ChatHeader({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex w-full shrink-0 items-center justify-between gap-3 py-2">
        {children}
      </div>
    </TooltipProvider>
  );
}

export function ChatTitle() {
  const {
    state: { title, hasMessages },
  } = useFloosChat();

  if (!title && !hasMessages) return <span className="min-w-0 flex-1" />;

  return (
    <span className="min-w-0 flex-1 truncate text-center text-sm font-medium">
      {title ?? "New chat"}
    </span>
  );
}

export function ChatNewButton() {
  const { actions } = useFloosChat();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Start a new chat"
            onClick={() => {
              void actions.reset();
            }}
          />
        }
      >
        <Icons.plus />
      </TooltipTrigger>
      <TooltipContent>Start a new chat</TooltipContent>
    </Tooltip>
  );
}

export function ChatBackButton({ onBack }: { onBack: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Back to overview"
            onClick={onBack}
          />
        }
      >
        <Icons.arrowLeft />
      </TooltipTrigger>
      <TooltipContent>Back to overview</TooltipContent>
    </Tooltip>
  );
}

export function ChatShell({ header }: { header: React.ReactNode }) {
  return (
    <ChatView>
      <ChatHeader>{header}</ChatHeader>
      <ChatThread />
      <div className="mx-auto w-full max-w-3xl shrink-0 bg-background pt-4">
        <ChatReplyInput />
        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          Floos AI can make mistakes. Please double-check responses.
        </p>
      </div>
    </ChatView>
  );
}
