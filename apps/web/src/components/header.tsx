import { Icons } from "@floos/ui/components/icons";
import { Link } from "@tanstack/react-router";

import UserMenu from "./user-menu";

export default function Header() {
  // const links = [
  //   { to: "/", label: "Home" },
  //   { to: "/dashboard", label: "Dashboard" },
  // ] as const;

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Link to="/">
          <Icons.logo className="size-6" />
        </Link>

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
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
