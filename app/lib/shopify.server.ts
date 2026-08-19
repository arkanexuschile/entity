/**
 * Cliente centralizado de Shopify Admin API.
 *
 * Maneja: autenticación, rate limiting, retry con backoff,
 * normalización de errores y modo dry-run.
 *
 * Requiere en .env:
 * - SHOPIFY_SHOP_DOMAIN (ej: piedrabruja.myshopify.com)
 * - SHOPIFY_ADMIN_TOKEN (custom app access token)
 */

const API_VERSION = "2026-04";

// --- Configuración ---

function getConfig() {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!shop || !token) {
    return null;
  }
  return { shop, token, baseUrl: `https://${shop}/admin/api/${API_VERSION}` };
}

export function isShopifyConfigured(): boolean {
  return getConfig() !== null;
}

// --- Rate limiting (token bucket simple) ---

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 510; // ~2 req/s para REST

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

// --- Request con retry ---

type ShopifyResponse<T> = {
  ok: boolean;
  data: T | null;
  errors: string[];
  rateLimit?: { used: string; limit: string };
};

async function shopifyFetch<T>(
  path: string,
  options: RequestInit = {},
  retries = 2
): Promise<ShopifyResponse<T>> {
  const config = getConfig();
  if (!config) {
    return { ok: false, data: null, errors: ["Shopify no está configurado. Agregá SHOPIFY_SHOP_DOMAIN y SHOPIFY_ADMIN_TOKEN al .env."] };
  }

  const url = `${config.baseUrl}${path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle();

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": config.token,
          ...options.headers,
        },
      });

      const rateLimit = {
        used: res.headers.get("X-Shopify-Shop-Api-Call-Limit")?.split("/")[0] ?? "0",
        limit: res.headers.get("X-Shopify-Shop-Api-Call-Limit")?.split("/")[1] ?? "40",
      };

      // Rate limit hit — wait and retry
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }
        return { ok: false, data: null, errors: [`Rate limit alcanzado después de ${retries + 1} intentos`], rateLimit };
      }

      // Errores de server — retry
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, data: null, errors: [`HTTP ${res.status}: ${body.slice(0, 200)}`], rateLimit };
      }

      const data = (await res.json()) as T;
      return { ok: true, data, errors: [], rateLimit };
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return { ok: false, data: null, errors: [`Error de red: ${err instanceof Error ? err.message : String(err)}`] };
    }
  }

  return { ok: false, data: null, errors: ["Número máximo de reintentos alcanzado"] };
}

// --- Endpoints de alto nivel ---

/** Verifica la conexión con Shopify (health check). */
export async function checkConnection(): Promise<{
  connected: boolean;
  shopName?: string;
  error?: string;
}> {
  const result = await shopifyFetch<{ shop: { name: string; domain: string } }>("/shop.json");
  if (!result.ok || !result.data) {
    return { connected: false, error: result.errors[0] };
  }
  return { connected: true, shopName: result.data.shop.name };
}

/** Lista productos (paginado). */
export async function getProducts(params: {
  limit?: number;
  page_info?: string;
  fields?: string;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.page_info) searchParams.set("page_info", params.page_info);
  if (params.fields) searchParams.set("fields", params.fields);

  const qs = searchParams.toString();
  return shopifyFetch<{ products: any[] }>(`/products.json${qs ? `?${qs}` : ""}`);
}

/** Obtiene un producto por ID. */
export async function getProduct(productId: number) {
  return shopifyFetch<{ product: any }>(`/products/${productId}.json`);
}

/** Agrega tags a un producto. */
export async function addTagsToProduct(productId: number, tags: string[]) {
  return shopifyFetch<{ product: any }>(`/products/${productId}.json`, {
    method: "PUT",
    body: JSON.stringify({ product: { id: productId, tags: tags.join(", ") } }),
  });
}

/** Escribe un metafield en un producto. */
export async function setProductMetafield(
  productId: number,
  namespace: string,
  key: string,
  value: string,
  type = "single_line_text_field"
) {
  return shopifyFetch<{ product: any }>(`/products/${productId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      product: {
        id: productId,
        metafields: [{ namespace, key, value, type }],
      },
    }),
  });
}

/** Lista colecciones. */
export async function getCollections() {
  return shopifyFetch<{ custom_collections: any[] }>("/custom_collections.json?limit=250");
}

/** Obtiene órdenes recientes. */
export async function getOrders(params: { status?: string; limit?: number } = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return shopifyFetch<{ orders: any[] }>(`/orders.json${qs ? `?${qs}` : ""}`);
}

// --- Modo Dry Run ---

let dryRunMode = false;
const dryRunLog: string[] = [];

export function setDryRun(enabled: boolean) {
  dryRunMode = enabled;
  dryRunLog.length = 0;
}

export function getDryRunLog(): string[] {
  return [...dryRunLog];
}

export function isDryRun(): boolean {
  return dryRunMode;
}

/** Wrapper que en modo dry-run solo loguea en vez de escribir. */
export async function dryRunOrExecute<T>(
  description: string,
  execute: () => Promise<T>
): Promise<T | null> {
  if (dryRunMode) {
    dryRunLog.push(`[DRY RUN] ${description}`);
    return null;
  }
  return execute();
}
