import { initLogger } from "evlog";

initLogger({
  env: { service: "floos-server" },
});

export { default } from "./app";
export type { AppType } from "./app";
