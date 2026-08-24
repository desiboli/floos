import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/_auth/_app/");

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function OverviewPage() {
  const { session } = routeApi.useRouteContext();
  const firstName = session.user.name?.trim().split(/\s+/)[0];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <h1 className="text-4xl font-heading text-center">
        {getGreeting()}
        <span className="text-muted-foreground">{firstName ? `, ${firstName}` : ""}</span>
      </h1>
    </div>
  );
}
