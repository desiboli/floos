import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";
import { useSidebar } from "@floos/ui/components/sidebar";
import { Link } from "@tanstack/react-router";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const { toggleSidebar } = useSidebar();

  // const links = [
  //   { to: "/", label: "Home" },
  //   { to: "/dashboard", label: "Dashboard" },
  // ] as const;

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <Icons.sidebar />
        </Button>

        {/* <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            return (
              <Link key={to} to={to}>
                {label}
              </Link>
            );
          })}
        </nav> */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
