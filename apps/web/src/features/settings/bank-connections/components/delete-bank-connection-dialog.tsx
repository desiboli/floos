import { Button } from "@floos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@floos/ui/components/dialog";
import { Field, FieldLabel } from "@floos/ui/components/field";
import { Icons } from "@floos/ui/components/icons";
import { Input } from "@floos/ui/components/input";
import { useState } from "react";

import { useDeleteBankConnection } from "@/features/banking/hooks/use-delete-bank-connection";
import type { BankConnectionListItem } from "@/features/banking/services/types";

const CONFIRM_TEXT = "DELETE";

export function DeleteBankConnectionDialog({
  connection,
}: {
  connection: BankConnectionListItem;
}) {
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const remove = useDeleteBankConnection();
  const confirmId = `confirm-delete-${connection.id}`;
  const canDelete = confirmValue === CONFIRM_TEXT && !remove.isPending;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setConfirmValue("");
  }

  async function handleDelete() {
    if (!canDelete) return;
    try {
      await remove.mutateAsync(connection.id);
      handleOpenChange(false);
    } catch {
      // Toast is handled by the mutation.
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label="Delete connection"
        disabled={remove.isPending}
        onClick={() => setOpen(true)}
      >
        <Icons.trash />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            <DialogHeader>
              <DialogTitle>Delete bank connection</DialogTitle>
              <DialogDescription>
                Delete “{connection.name}”? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              <Icons.alertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-2">
                <p>
                  This permanently removes the connection, its accounts, and all imported
                  transactions. Reconnecting this bank later creates a new connection and will not
                  restore that history.
                </p>
                {connection.accounts.length > 0 ? (
                  <>
                    <p className="font-medium">These accounts will be removed:</p>
                    <ul className="list-inside list-disc">
                      {connection.accounts.map((account) => (
                        <li key={account.id}>{account.name}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
            <Field>
              <FieldLabel htmlFor={confirmId} className="normal-case tracking-normal">
                Type <span className="font-semibold">{CONFIRM_TEXT}</span> to confirm
              </FieldLabel>
              <Input
                id={confirmId}
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={!canDelete}>
                Delete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
