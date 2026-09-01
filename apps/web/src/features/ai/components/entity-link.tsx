import { useNavigate } from "@tanstack/react-router";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const INTERNAL_PATH = /^\/[a-z0-9/_-]*$/i;

const INTERNAL_ROUTES = new Set([
  "/",
  "/dashboard",
  "/reports",
  "/transactions",
  "/transactions/categories",
  "/settings",
  "/settings/bank-connections",
  "/settings/members",
  "/settings/billing",
  "/settings/notifications",
  "/account",
  "/account/spaces",
  "/account/security",
  "/account/date-and-locale",
  "/account/support",
]);

type EntityHref =
  | { kind: "transaction"; id: string }
  | { kind: "account" }
  | { kind: "category" }
  | { kind: "navigate"; path: string };

function parseEntityHref(href: string | undefined): EntityHref | null {
  if (!href) return null;
  if (!href.startsWith("#")) return null;

  const value = href.slice(1);
  const colon = value.indexOf(":");
  if (colon <= 0) return null;

  const kind = value.slice(0, colon);
  const rest = value.slice(colon + 1);

  if (kind === "transaction" && UUID.test(rest)) {
    return { kind: "transaction", id: rest };
  }
  if (kind === "account" && UUID.test(rest)) {
    return { kind: "account" };
  }
  if (kind === "category" && CATEGORY_SLUG.test(rest)) {
    return { kind: "category" };
  }
  if (kind === "navigate") {
    const pathname = rest.split("?")[0] ?? "";
    if (!INTERNAL_PATH.test(pathname) || pathname.startsWith("//")) return null;
    if (!INTERNAL_ROUTES.has(pathname)) return null;
    return { kind: "navigate", path: pathname };
  }

  return null;
}

export function EntityLink({
  href,
  children,
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const target = parseEntityHref(href);

  if (!target) {
    return <span>{children}</span>;
  }

  const destination = target;

  return (
    <button
      type="button"
      className="cursor-pointer font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
      onClick={() => {
        switch (destination.kind) {
          case "transaction":
            void navigate({ to: "/transactions", search: { txn: destination.id } });
            return;
          case "account":
            void navigate({ to: "/settings/bank-connections" });
            return;
          case "category":
            void navigate({ to: "/transactions/categories" });
            return;
          case "navigate":
            void navigate({ to: destination.path as never });
        }
      }}
    >
      {children}
    </button>
  );
}
