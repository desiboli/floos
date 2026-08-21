import { createRouter } from "../../lib/create-app";

const nativeAppUrl = "floos://";
const allowedNativeProtocols = new Set(["exp:", new URL(nativeAppUrl).protocol]);

const router = createRouter().get("/polar/success", (c) => {
  const requestUrl = new URL(c.req.url);
  const returnUrl = requestUrl.searchParams.get("returnUrl") || nativeAppUrl;

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(returnUrl);
  } catch {
    return c.text("Invalid return URL", 400);
  }

  if (!allowedNativeProtocols.has(redirectUrl.protocol)) {
    return c.text("Invalid return URL", 400);
  }

  return c.redirect(redirectUrl.toString(), 302);
});

export default router;
