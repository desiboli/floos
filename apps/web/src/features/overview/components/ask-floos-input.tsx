import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@floos/ui/components/attachment";
import { Badge } from "@floos/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@floos/ui/components/card";
import { Field, FieldLabel } from "@floos/ui/components/field";
import { Icons } from "@floos/ui/components/icons";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@floos/ui/components/input-group";

/** Flip to `false` to preview the empty (no chips) treatment. */
const SHOW_SAMPLE_CHIPS = false;

const promptToolClassName =
  "h-6 min-w-6 px-0 font-normal tracking-normal normal-case text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground";

const promptSendClassName = "size-6 p-0 font-normal tracking-normal";

export function AskFloosInput() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xs">
          <Icons.sparkles />
          Ask anything about your money
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="ask-floos" className="sr-only">
            Ask Floos
          </FieldLabel>
          <InputGroup className="h-auto flex-col items-stretch">
            {SHOW_SAMPLE_CHIPS ? (
              <InputGroupAddon align="block-start" className="px-2.5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    Qonto
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      className={promptToolClassName}
                      aria-label="Remove Qonto"
                    >
                      <Icons.x />
                    </InputGroupButton>
                  </Badge>
                  <AttachmentGroup>
                    <Attachment size="xs" state="done">
                      <AttachmentMedia>
                        <Icons.file />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>receipt.pdf</AttachmentTitle>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction aria-label="Remove receipt.pdf">
                          <Icons.x />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  </AttachmentGroup>
                </div>
              </InputGroupAddon>
            ) : null}
            <InputGroupTextarea
              id="ask-floos"
              placeholder="How can I help you today?"
              className="max-h-36 overflow-y-auto"
            />
            <InputGroupAddon align="block-end" className="justify-between px-2.5">
              <div className="flex items-center gap-1">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  className={promptToolClassName}
                  aria-label="Attach"
                >
                  <Icons.plus />
                </InputGroupButton>
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  className={promptToolClassName}
                  aria-label="Suggestions"
                >
                  <Icons.bolt />
                </InputGroupButton>
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  className={promptToolClassName}
                  aria-label="Mention"
                >
                  <Icons.at />
                </InputGroupButton>
              </div>
              <InputGroupButton
                type="button"
                size="icon-xs"
                variant="default"
                className={promptSendClassName}
                aria-label="Send"
              >
                <Icons.arrowUp />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </CardContent>
    </Card>
  );
}
