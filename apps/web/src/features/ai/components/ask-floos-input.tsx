import { Button } from "@floos/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@floos/ui/components/card";
import { Field, FieldLabel } from "@floos/ui/components/field";
import { Icons } from "@floos/ui/components/icons";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@floos/ui/components/input-group";

import { useFloosChat } from "../provider";
import { SuggestionsMenu } from "./suggestions-menu";

const promptToolClassName =
  "h-6 min-w-6 px-0 font-normal tracking-normal normal-case text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground";

const promptSendClassName = "size-6 p-0 font-normal tracking-normal";

function ComposerFields({
  placeholder,
  onSend,
}: {
  placeholder: string;
  onSend: (text?: string) => Promise<void>;
}) {
  const { state, actions, meta } = useFloosChat();
  const isSending = state.status === "submitted" || state.status === "streaming";
  const isBusy = isSending && state.ready;
  const canStop = Boolean(state.chatId) && isBusy;
  const canSend = state.inputValue.trim().length > 0 && !isBusy && state.ready;
  const isPendingSession = !state.ready && !state.error;
  const showError = Boolean(state.error) && state.status !== "streaming";

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (canStop) {
      actions.stop();
      return;
    }
    if (!canSend) return;
    void onSend();
  }

  return (
    <Field>
      <FieldLabel htmlFor="ask-floos" className="sr-only">
        Ask Floos
      </FieldLabel>
      <InputGroup className="h-auto flex-col items-stretch">
        <InputGroupTextarea
          ref={meta.inputRef}
          id="ask-floos"
          placeholder={isPendingSession ? "Connecting..." : placeholder}
          className="max-h-36 overflow-y-auto"
          value={state.inputValue}
          onChange={(event) => actions.setInputValue(event.target.value)}
          onKeyDown={onKeyDown}
          aria-busy={isPendingSession || isBusy}
          aria-invalid={showError || undefined}
        />
        <InputGroupAddon align="block-end" className="justify-between px-2.5">
          <div className="flex items-center gap-1">
            <InputGroupButton
              type="button"
              size="icon-xs"
              className={promptToolClassName}
              aria-label="Attach"
              aria-disabled
              title="Coming in a later release"
              disabled
            >
              <Icons.plus />
            </InputGroupButton>
            <SuggestionsMenu
              suggestions={state.suggestions}
              open={state.suggestionsOpen}
              onOpenChange={actions.setSuggestionsOpen}
              onSelect={(text) => {
                void onSend(text);
              }}
              disabled={!state.ready || isBusy || Boolean(state.error)}
            />
            <InputGroupButton
              type="button"
              size="icon-xs"
              className={promptToolClassName}
              aria-label="Mention"
              aria-disabled
              title="Coming in a later release"
              disabled
            >
              <Icons.at />
            </InputGroupButton>
          </div>
          {canStop ? (
            <InputGroupButton
              type="button"
              size="icon-xs"
              variant="default"
              className={promptSendClassName}
              aria-label="Stop"
              onClick={actions.stop}
            >
              <Icons.playerStop />
            </InputGroupButton>
          ) : (
            <InputGroupButton
              type="button"
              size="icon-xs"
              variant="default"
              className={promptSendClassName}
              aria-label="Send"
              disabled={!canSend}
              onClick={() => {
                void onSend();
              }}
            >
              <Icons.arrowUp />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
      {showError ? (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
          {!state.ready ? (
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto px-0 font-normal tracking-normal normal-case"
              onClick={() => {
                actions.retry();
              }}
            >
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}
    </Field>
  );
}

export function AskFloosInput() {
  const { actions } = useFloosChat();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xs">
          <Icons.sparkles />
          Ask anything about your money
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ComposerFields
          placeholder="How can I help you today?"
          onSend={(text) => actions.send(text, { fresh: true })}
        />
      </CardContent>
    </Card>
  );
}

export function ChatReplyInput() {
  const { actions } = useFloosChat();

  return (
    <Card>
      <CardContent className="pt-4">
        <ComposerFields placeholder="Reply..." onSend={(text) => actions.send(text)} />
      </CardContent>
    </Card>
  );
}
