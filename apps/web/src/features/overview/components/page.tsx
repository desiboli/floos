import { getRouteApi } from "@tanstack/react-router";

import { FloosChat } from "@/features/ai";
import { useUserSpaces } from "@/features/spaces/hooks/use-user-spaces";

const overviewRouteApi = getRouteApi("/_auth/_app/");

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function OverviewDashboard() {
  const { session } = overviewRouteApi.useRouteContext();
  const firstName = session.user.name?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col justify-center">
      <div className="flex w-full flex-col items-center pt-6 pb-10 text-center">
        <h1 className="text-center font-heading text-4xl">
          {greeting()}
          <span className="text-muted-foreground">{firstName ? `, ${firstName}` : ""}</span>
        </h1>
      </div>
      <FloosChat.Composer />
    </div>
  );
}

function OverviewChat() {
  const navigate = overviewRouteApi.useNavigate();

  return (
    <FloosChat.Shell
      header={
        <>
          <FloosChat.Back
            onBack={() => {
              void navigate({ search: {}, replace: true });
            }}
          />
          <FloosChat.Title />
          <FloosChat.NewChat />
        </>
      }
    />
  );
}

export function OverviewPage() {
  const { assistant } = overviewRouteApi.useSearch();
  const navigate = overviewRouteApi.useNavigate();
  const { activeSpaceId } = useUserSpaces();

  return (
    <FloosChat.Provider
      key={activeSpaceId}
      onOpen={() => {
        void navigate({ search: { assistant: true }, replace: true });
      }}
    >
      <div className="-mx-4 -my-4 flex h-[calc(100svh-var(--header-height))] min-h-0 w-full flex-col overflow-hidden px-4 py-4 md:-mx-8 md:-my-8 md:px-8 md:py-8">
        {assistant ? <OverviewChat /> : <OverviewDashboard />}
      </div>
    </FloosChat.Provider>
  );
}
