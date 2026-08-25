import { Button } from "@floos/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@floos/ui/components/empty";
import { Link } from "@tanstack/react-router";

export function BankConnectionsEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyTitle>No banks connected</EmptyTitle>
        <EmptyDescription>
          Connect a bank during onboarding, then manage health and reconnect here.
        </EmptyDescription>
      </EmptyHeader>
      <Button nativeButton={false} render={<Link to="/onboarding" search={{ s: "connect-bank" }} />}>
        Connect a bank
      </Button>
    </Empty>
  );
}
