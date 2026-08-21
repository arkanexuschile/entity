import { prisma } from "@entity/database";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ============================================================
// CLIENTE SHOPIFY — custom app de la tienda (Admin API).
// Fuente del pipeline: pedidos (SalesInvoice), catálogo (Item),
// carritos abandonados (AbandonedCart).
// Requiere en .env: SHOPIFY_SHOP_DOMAIN, SHOPIFY_CLIENT_ID,
// SHOPIFY_CLIENT_SECRET. El token se obtiene por OAuth y se
// guarda en un archivo local (gitignored).
// Scopes Admin API: read_products, read_orders, read_customers,
// read_checkouts.
// ============================================================

const API_VERSION = "2024-10";
const SCOPES = "read_products,read_orders,read_customers,read_checkouts";
const TOKEN_FILE = path.join(process.cwd(), ".shopify-auth.json");

function getStoredToken(): string | undefined {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return undefined;
    const raw = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
    return typeof raw?.accessToken === "string" ? raw.accessToken : undefined;
  } catch {
    return undefined;
  }
}

export function saveShopifyToken(accessToken: string, shop: string) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ accessToken, shop, savedAt: new Date().toISOString() }, null, 2));
}

function getShopifyToken(): string | undefined {
  return process.env.SHOPIFY_ADMIN_TOKEN || getStoredToken();
}

function getShopDomain(): string | undefined {
  return process.env.SHOPIFY_SHOP_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function isShopifyConfigured() {
  return Boolean(getShopDomain() && process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET && getShopifyToken());
}

export function isShopifyInstalled() {
  return Boolean(getShopDomain() && getShopifyToken());
}

export function shopifyAuthUrl(state: string, redirectUri: string) {
  const shop = getShopDomain();
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  if (!shop || !clientId) throw new Error("Shopify no configurado: faltan SHOPIFY_SHOP_DOMAIN o SHOPIFY_CLIENT_ID.");
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    "grant_options[]": "per-user",
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeShopifyCode(shop: string, code: string): Promise<string> {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Faltan SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET.");
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Shopify OAuth token exchange falló (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Shopify OAuth no devolvió access_token.");
  return data.access_token;
}

export function newOAuthState(): string {
  return crypto.randomBytes(24).toString("hex");
}

function baseUrl() {
  const shop = getShopDomain();
  if (!shop) throw new Error("SHOPIFY_SHOP_DOMAIN no configurado.");
  return `https://${shop}/admin/api/${API_VERSION}`;
}

async function shopifyFetch<T>(path: string): Promise<T> {
  const token = getShopifyToken();
  if (!token) throw new Error("SHOPIFY_ADMIN_TOKEN no configurado — conecta la app con Shopify.");
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Shopify API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

async function fetchAll<T>(path: (pageInfo: string | null) => string): Promise<T[]> {
  const out: T[] = [];
  let pageInfo: string | null = null;
  for (;;) {
    const data: Record<string, unknown> = await shopifyFetch<Record<string, unknown>>(path(pageInfo));
    const listKey = Object.keys(data).find((k) => Array.isArray(data[k]));
    if (!listKey) break;
    const list = data[listKey] as T[];
    out.push(...list);
    const info = data["page_info"];
    if (typeof info === "string") pageInfo = info;
    else break;
    if (out.length > 10000) break;
  }
  return out;
}

interface ShopifyVariant {
  id: number;
  sku: string | null;
  price: string;
  inventory_quantity: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  product_type: string | null;
  vendor: string | null;
  barcode: string | null;
  variants: ShopifyVariant[];
}

interface ShopifyLineItem {
  variant_id: number | null;
  sku: string | null;
  title: string;
  quantity: number;
  price: string;
}

interface ShopifyCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

interface ShopifyOrder {
  id: number;
  name: string; // ej. "#1001"
  created_at: string;
  closed_at: string | null;
  email: string | null;
  contact_email: string | null;
  customer: ShopifyCustomer | null;
  line_items: ShopifyLineItem[];
  landing_site: string | null;
  source_name: string | null;
  financial_status: string | null; // paid | pending | voided | refunded
  currency: string;
  total_price: string;
}

interface ShopifyCheckout {
  id: number;
  token: string;
  abandoned_checkout_url: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  customer: ShopifyCustomer | null;
  line_items: ShopifyLineItem[];
  name: string | null;
}

interface ShopifyCustomerInfo {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

interface ShopifyCheckoutWithCustomer {
  id: number;
  token: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  customer: ShopifyCustomerInfo | null;
  line_items: ShopifyLineItem[];
  name: string | null;
}

// ------------------------------------------------------------
// Catálogo: productos -> Item
// ------------------------------------------------------------

export async function syncProductos() {
  const log = await prisma.ingestLog.create({ data: { source: "Shopify" } });
  try {
    const company = await prisma.company.findFirstOrThrow();
    const products = await fetchAll<ShopifyProduct>((pageInfo) =>
      pageInfo ? `/products.json?limit=250&page_info=${encodeURIComponent(pageInfo)}` : "/products.json?limit=250"
    );

    let creados = 0;
    let actualizados = 0;
    let sinSku = 0;

    for (const p of products) {
      for (const v of p.variants) {
        if (!v.sku) {
          sinSku += 1;
          continue;
        }
        const existing = await prisma.item.findUnique({
          where: { companyId_itemCode: { companyId: company.id, itemCode: v.sku } },
        });
        if (existing) {
          await prisma.item.update({
            where: { id: existing.id },
            data: {
              itemName: p.title,
              itemGroup: p.product_type ?? undefined,
              standardRate: Number(v.price),
              barcode: p.barcode ?? undefined,
            },
          });
          actualizados += 1;
        } else {
          await prisma.item.create({
            data: {
              itemCode: v.sku,
              itemName: p.title,
              itemGroup: p.product_type ?? undefined,
              barcode: p.barcode ?? undefined,
              standardRate: Number(v.price),
              valuationMethod: "FIFO",
              companyId: company.id,
            },
          });
          creados += 1;
        }
      }
    }

    const msg = `${products.length} productos, ${creados} ítems creados, ${actualizados} actualizados${sinSku ? `, ${sinSku} variantes sin SKU omitidas` : ""}.`;
    await prisma.ingestLog.update({ where: { id: log.id }, data: { status: "Done", docsCount: products.length, message: msg, finishedAt: new Date() } });
    return { source: "Shopify", count: products.length, creados, actualizados, sinSku, message: msg };
  } catch (e) {
    await prisma.ingestLog.update({
      where: { id: log.id },
      data: { status: "Failed", message: e instanceof Error ? e.message : String(e), finishedAt: new Date() },
    });
    throw e;
  }
}

// ------------------------------------------------------------
// Pedidos: orders -> SalesInvoice
// ------------------------------------------------------------

function parseUtm(url: string | null) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    const g = (k: string) => u.searchParams.get(k) ?? undefined;
    const source = g("utm_source") ?? (u.searchParams.has("gclid") ? "google" : undefined);
    return {
      source,
      medium: g("utm_medium"),
      campaign: g("utm_campaign"),
      term: g("utm_term"),
      content: g("utm_content"),
    };
  } catch {
    return undefined;
  }
}

async function ensureCustomer(companyId: string, customer: ShopifyCustomer | null, email: string | null) {
  const name = customer ? `SHOP-${customer.id}` : email ? `SHOP-${email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}` : "SHOP-anon";
  let c = await prisma.customer.findUnique({ where: { companyId_name: { companyId, name } } });
  if (!c) {
    const full = customer ? [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() : "";
    c = await prisma.customer.create({
      data: {
        name,
        customerName: full || email || "Cliente Shopify",
        email: customer?.email ?? email ?? undefined,
        phone: customer?.phone ?? undefined,
        companyId,
      },
    });
  }
  return c;
}

export async function syncPedidos() {
  const log = await prisma.ingestLog.create({ data: { source: "Shopify" } });
  try {
    const company = await prisma.company.findFirstOrThrow();
    const warehouse = await prisma.warehouse.findFirstOrThrow({ where: { companyId: company.id } });
    const iva = await prisma.taxTemplate.findFirstOrThrow({ where: { companyId: company.id, isVat: true } });
    const ivaRate = Number(iva.rate);

    const orders = await fetchAll<ShopifyOrder>((pageInfo) =>
      pageInfo ? `/orders.json?limit=250&status=any&page_info=${encodeURIComponent(pageInfo)}` : "/orders.json?limit=250&status=any"
    );

    let creadas = 0;
    let omitidas = 0;
    let lineasSinItem = 0;

    for (const o of orders) {
      const name = o.name;
      const existing = await prisma.salesInvoice.findUnique({
        where: { companyId_name: { companyId: company.id, name } },
      });
      if (existing) {
        omitidas += 1;
        continue;
      }

      if (!o.line_items || o.line_items.length === 0) {
        omitidas += 1;
        continue;
      }

      const customer = await ensureCustomer(company.id, o.customer, o.contact_email ?? o.email);
      const utm = parseUtm(o.landing_site);
      let campaignId: string | null = null;
      if (utm?.campaign) {
        const campaign = await prisma.campaign.findFirst({ where: { name: { contains: utm.campaign, mode: "insensitive" } } });
        campaignId = campaign?.id ?? null;
      }

      const items: Array<{ itemId: string; qty: number; rate: number; amount: number; warehouseId: string }> = [];
      let netTotal = 0;
      for (const l of o.line_items) {
        const itemCode = l.sku ?? (l.variant_id ? `SHOP-${l.variant_id}` : null);
        if (!itemCode) {
          lineasSinItem += 1;
          continue;
        }
        const item = await prisma.item.findUnique({
          where: { companyId_itemCode: { companyId: company.id, itemCode } },
        });
        if (!item) {
          lineasSinItem += 1;
          continue;
        }
        const qty = l.quantity;
        const rate = Number(l.price);
        const amount = qty * rate;
        netTotal += amount;
        items.push({ itemId: item.id, qty, rate, amount, warehouseId: warehouse.id });
      }

      if (items.length === 0) {
        omitidas += 1;
        continue;
      }

      // Shopify envía totales sin IVA desglosado: reconstruimos con la tasa del template.
      const status = o.financial_status === "paid" ? "Paid" : "Pending";
      const totalTax = netTotal * (ivaRate / 100);
      const grandTotal = netTotal + totalTax;

      await prisma.salesInvoice.create({
        data: {
          name,
          postingDate: new Date(o.created_at),
          status,
          currency: o.currency,
          customerId: customer.id,
          warehouseId: warehouse.id,
          companyId: company.id,
          netTotal,
          totalTax,
          grandTotal,
          utmSource: utm?.source,
          utmMedium: utm?.medium,
          utmCampaign: utm?.campaign,
          utmTerm: utm?.term,
          utmContent: utm?.content,
          sourceName: o.source_name ?? "web",
          campaignId,
          items: { create: items },
        },
      });

      for (const l of items) {
        const ledger = await prisma.stockLedgerEntry.findFirst({
          where: { itemId: l.itemId, warehouseId: warehouse.id, isCancelled: false },
          orderBy: { postingDate: "desc" },
        });
        const balQty = Number(ledger?.balanceQty ?? 0);
        const balValue = Number(ledger?.balanceValue ?? 0);
        const costPerUnit = balQty > 0 ? balValue / balQty : l.rate;
        const cogs = l.qty * costPerUnit;
        const newQty = balQty - l.qty;
        const newValue = newQty <= 0 ? 0 : balValue - cogs;

        await prisma.stockLedgerEntry.create({
          data: {
            postingDate: new Date(o.created_at),
            itemId: l.itemId,
            warehouseId: warehouse.id,
            actualQty: -l.qty,
            valuationRate: costPerUnit,
            stockValue: -cogs,
            balanceQty: newQty,
            balanceValue: newValue,
            voucherType: "SalesInvoice",
            voucherNo: o.name,
            companyId: company.id,
          },
        });
      }

      creadas += 1;
    }

    const msg = `${orders.length} pedidos, ${creadas} facturas creadas, ${omitidas} omitidas (ya existían/sin líneas)${lineasSinItem ? `, ${lineasSinItem} líneas sin ítem en catálogo` : ""}.`;
    await prisma.ingestLog.update({ where: { id: log.id }, data: { status: "Done", docsCount: creadas, message: msg, finishedAt: new Date() } });
    return { source: "Shopify", count: creadas, omitidas, lineasSinItem, message: msg };
  } catch (e) {
    await prisma.ingestLog.update({
      where: { id: log.id },
      data: { status: "Failed", message: e instanceof Error ? e.message : String(e), finishedAt: new Date() },
    });
    throw e;
  }
}

// ------------------------------------------------------------
// Carritos abandonados: abandoned checkouts -> AbandonedCart
// ------------------------------------------------------------

export async function syncCarritos() {
  const log = await prisma.ingestLog.create({ data: { source: "Shopify" } });
  try {
    const checkouts = await fetchAll<ShopifyCheckout>((pageInfo) =>
      pageInfo ? `/checkouts.json?limit=250&status=open&page_info=${encodeURIComponent(pageInfo)}` : "/checkouts.json?limit=250&status=open"
    );

    let creados = 0;
    let actualizados = 0;

    for (const c of checkouts) {
      const cartId = c.token || String(c.id);
      const items = c.line_items?.map((l) => ({
        itemCode: l.sku ?? (l.variant_id ? `SHOP-${l.variant_id}` : null),
        itemName: l.title,
        qty: l.quantity,
        price: Number(l.price),
      })) ?? [];

      const customerName = c.customer ? [c.customer.first_name, c.customer.last_name].filter(Boolean).join(" ").trim() : null;

      const existing = await prisma.abandonedCart.findUnique({ where: { shopifyCartId: cartId } });
      if (existing) {
        await prisma.abandonedCart.update({
          where: { id: existing.id },
          data: {
            customerName: customerName ?? undefined,
            email: c.email ?? undefined,
            phone: c.phone ?? undefined,
            items: items.length ? items : undefined,
            total: Number(c.total_price ?? 0),
            shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
          },
        });
        actualizados += 1;
      } else {
        await prisma.abandonedCart.create({
          data: {
            shopifyCartId: cartId,
            customerName,
            email: c.email ?? undefined,
            phone: c.phone ?? undefined,
            items: items.length ? items : undefined,
            total: Number(c.total_price ?? 0),
            abandonedAt: new Date(c.updated_at ?? c.created_at),
            shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
          },
        });
        creados += 1;
      }
    }

    const msg = `${checkouts.length} carritos abandonados: ${creados} creados, ${actualizados} actualizados.`;
    await prisma.ingestLog.update({ where: { id: log.id }, data: { status: "Done", docsCount: creados, message: msg, finishedAt: new Date() } });
    return { source: "Shopify", count: creados, actualizados, message: msg };
  } catch (e) {
    await prisma.ingestLog.update({
      where: { id: log.id },
      data: { status: "Failed", message: e instanceof Error ? e.message : String(e), finishedAt: new Date() },
    });
    throw e;
  }
}

export async function syncShopifyTodo() {
  const resultados = {
    productos: await syncProductos(),
    pedidos: await syncPedidos(),
    carritos: await syncCarritos(),
  };
  return resultados;
}