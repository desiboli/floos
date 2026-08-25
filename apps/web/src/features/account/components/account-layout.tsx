import { Tabs, TabsList, TabsTrigger } from "@floos/ui/components/tabs";
import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";

const ACCOUNT_TABS = [
  { value: "general", to: "/account", label: "General" },
  { value: "date-locale", to: "/account/date-and-locale", label: "Date & Locale" },
  { value: "security", to: "/account/security", label: "Security" },
  { value: "spaces", to: "/account/spaces", label: "Spaces" },
  { value: "support", to: "/account/support", label: "Support" },
] as const;

export function AccountLayout() {
  const matchRoute = useMatchRoute();
  const activeTab =
    ACCOUNT_TABS.find((tab) => tab.to !== "/account" && matchRoute({ to: tab.to }))?.value ??
    "general";

  return (
    <div>
      <Tabs value={activeTab}>
        <TabsList>
          {ACCOUNT_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              nativeButton={false}
              render={<Link to={tab.to} />}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="max-w-200 mt-8">
        <Outlet />
      </div>
    </div>
  );
}
