import type { AppType } from "server";

import { env } from "@floos/env/web";
import { hc } from "hono/client";

export const api = hc<AppType>(env.VITE_SERVER_URL, {
  init: {
    credentials: "include",
  },
});
