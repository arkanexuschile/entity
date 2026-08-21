import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { requireUser } from "../lib/auth.server";
import { exchangeShopifyCode, saveShopifyToken } from "../lib/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const shop = url.searchParams.get("shop");
  const error = url.searchParams.get("error");

  if (error) {
    return redirect(`/?shopify=error:${encodeURIComponent(error)}`);
  }
  if (!code || !shop) {
    return redirect("/?shopify=error:falta_code");
  }

  const configured = process.env.SHOPIFY_SHOP_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (configured && shop.toLowerCase() !== configured.toLowerCase()) {
    return redirect(`/?shopify=error:tienda_distinta`);
  }

  try {
    const token = await exchangeShopifyCode(shop, code);
    saveShopifyToken(token, shop);
    return redirect("/?shopify=ok");
  } catch (e) {
    return redirect(`/?shopify=error:${encodeURIComponent(e instanceof Error ? e.message : String(e))}`);
  }
}