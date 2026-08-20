import { Icons } from "@floos/ui/components/icons";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
export const Route = createFileRoute("/_legal")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-10">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between">
          <Link className="flex items-center gap-2 font-medium" to="/">
            <Icons.floos className="size-8" />
            Floos
          </Link>
          <nav className="flex gap-4 text-muted-foreground text-sm">
            <Link className="hover:text-foreground" to="/terms">
              Terms
            </Link>
            <Link className="hover:text-foreground" to="/policy">
              Privacy
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto w-full max-w-3xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
