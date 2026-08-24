import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@floos/ui/components/empty";
import { Icons } from "@floos/ui/components/icons";

function CategoriesEmptyFrame({ description }: { description: string }) {
  return (
    <Empty className="flex-1 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icons.category />
        </EmptyMedia>
        <EmptyTitle>No categories found</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function CategoriesSearchEmpty() {
  return <CategoriesEmptyFrame description="Try a different search, or create a category." />;
}

export function CategoriesSetupEmpty() {
  return (
    <CategoriesEmptyFrame description="Categories will appear here after this space is set up." />
  );
}
