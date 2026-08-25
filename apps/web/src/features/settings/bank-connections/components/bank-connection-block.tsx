import type { BankConnectionListItem } from "@/features/banking/services/types";

import { BankAccountCard } from "./bank-account-card";
import { BankConnectionHeader } from "./bank-connection-header";

export function BankConnectionBlock({
  connection,
  reconnectPending,
  onReconnect,
}: {
  connection: BankConnectionListItem;
  reconnectPending: boolean;
  onReconnect: (connectionId: string) => void;
}) {
  return (
    <div>
      <BankConnectionHeader
        connection={connection}
        reconnectPending={reconnectPending}
        onReconnect={onReconnect}
      />
      {connection.accounts.length > 0 ? (
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          {connection.accounts.map((account) => (
            <BankAccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
