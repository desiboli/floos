import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
} from "@floos/ui/components/item";
import { Skeleton } from "@floos/ui/components/skeleton";

export function BankConnectionsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index}>
          <Item variant="outline">
            <ItemMedia variant="image">
              <Skeleton className="size-full rounded-full" />
            </ItemMedia>
            <ItemContent>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </ItemContent>
          </Item>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            {Array.from({ length: 2 }, (_, tile) => (
              <Item key={tile} variant="muted">
                <ItemMedia>
                  <Skeleton className="size-10" />
                </ItemMedia>
                <ItemContent>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-7 w-28" />
                </ItemContent>
                <ItemActions>
                  <Skeleton className="h-4.5 w-8.25" />
                </ItemActions>
              </Item>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
