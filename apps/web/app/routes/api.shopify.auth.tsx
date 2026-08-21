import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { requireUser } from "../lib/auth.server";
import { shopifyAuthUrl, newOAuthState } from "../lib/shopify.server";

const BASE = process.env.APP_BASE_URL ?? "http://localhost:3000";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const redirectUri = `${BASE}/api/shopify/callback`;
  const state = newOAuthState();
  return redirect(shopifyAuthUrl(state, redirectUri));
}