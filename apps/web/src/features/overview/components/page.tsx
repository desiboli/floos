import { getRouteApi } from "@tanstack/react-router";

import { AskFloosInput } from "./ask-floos-input";

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
    <div className="container mx-auto max-w-3xl px-4 py-2 flex flex-col justify-between min-h-[calc(100vh-120px)] w-full">
      <div className="flex flex-col items-center text-center pt-6 pb-10 w-full">
        <h1 className="text-4xl font-heading text-center">
          {getGreeting()}
          <span className="text-muted-foreground">{firstName ? `, ${firstName}` : ""}</span>
        </h1>
      </div>
      <AskFloosInput />
    </div>
  );
}
