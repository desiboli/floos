import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@floos/ui/components/toast";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

// import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

export interface RouterAppContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "floos",
      },
      {
        name: "description",
        content: "floos is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="grid h-svh min-w-0 grid-rows-[auto_1fr] overflow-x-hidden">
          {/* <Header /> */}
          <Outlet />
        </div>
        <Toaster />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
