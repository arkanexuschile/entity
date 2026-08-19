import type { Route } from "./+types/shopify-test";
import { checkConnection, isShopifyConfigured, getProducts } from "~/lib/shopify.server";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Diagnóstico Shopify — Entity" }];
}

export async function loader({}: Route.LoaderArgs) {
  if (!isShopifyConfigured()) {
    return {
      configured: false,
      connection: null,
      products: null,
    };
  }

  const connection = await checkConnection();
  let products = null;

  if (connection.connected) {
    const prodResult = await getProducts({ limit: 5, fields: "id,title,handle,status,tags" });
    products = prodResult.ok ? prodResult.data?.products : null;
  }

  return {
    configured: true,
    connection,
    products,
  };
}

export default function ShopifyTest({ loaderData }: Route.ComponentProps) {
  const { configured, connection, products } = loaderData;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-amber-400 text-xl">&#9876;</span>
        <h1 className="text-xl font-bold text-gray-100">Diagnóstico Shopify</h1>
      </div>
      <p className="text-sm text-gray-500 mt-1 ml-9">
        Verificación de conexión con la Admin API
      </p>

      <div className="mt-6 space-y-4">
        {/* Estado de configuración */}
        <Card title="1. Configuración">
          <div className="flex items-center gap-2">
            <Badge color={configured ? "green" : "red"}>
              {configured ? "Configurado" : "Sin configurar"}
            </Badge>
            {!configured && (
              <p className="text-xs text-gray-500">
                Agregá <code className="bg-gray-800 px-1 rounded">SHOPIFY_SHOP_DOMAIN</code> y{" "}
                <code className="bg-gray-800 px-1 rounded">SHOPIFY_ADMIN_TOKEN</code> al .env
              </p>
            )}
          </div>
        </Card>

        {/* Estado de conexión */}
        {configured && connection && (
          <Card title="2. Conexión">
            <div className="flex items-center gap-2">
              <Badge color={connection.connected ? "green" : "red"}>
                {connection.connected ? "Conectado" : "Error"}
              </Badge>
              {connection.shopName && (
                <span className="text-sm text-gray-400">
                  Tienda: <span className="text-gray-200">{connection.shopName}</span>
                </span>
              )}
              {connection.error && (
                <p className="text-xs text-red-400 mt-1">{connection.error}</p>
              )}
            </div>
          </Card>
        )}

        {/* Productos de prueba */}
        {products && (
          <Card title="3. Productos (muestra)">
            <div className="space-y-2">
              {products.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1 border-b border-gray-800 last:border-0">
                  <span className="text-sm text-gray-200">{p.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge color={p.status === "active" ? "green" : "gray"}>
                      {p.status}
                    </Badge>
                    {p.tags && (
                      <span className="text-[10px] text-gray-500 max-w-[200px] truncate">
                        {p.tags}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
