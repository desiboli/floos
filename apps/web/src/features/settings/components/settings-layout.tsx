import { Tabs, TabsList, TabsTrigger } from "@floos/ui/components/tabs";
import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";

const SETTINGS_TABS = [
  { value: "general", to: "/settings", label: "General" },
  { value: "billing", to: "/settings/billing", label: "Billing" },
  { value: "bank-connections", to: "/settings/bank-connections", label: "Bank Connections" },
  { value: "members", to: "/settings/members", label: "Members" },
  { value: "notifications", to: "/settings/notifications", label: "Notifications" },
] as const;

export function SettingsLayout() {
  const matchRoute = useMatchRoute();
  const activeTab =
    SETTINGS_TABS.find((tab) => tab.to !== "/settings" && matchRoute({ to: tab.to }))?.value ??
    "general";

  return (
    <div>
      <Tabs value={activeTab}>
        <TabsList>
          {SETTINGS_TABS.map((tab) => (
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
