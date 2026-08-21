import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("api/shopify/auth", "routes/api.shopify.auth.tsx"),
  route("api/shopify/callback", "routes/api.shopify.callback.tsx"),
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
  ]),
] satisfies RouteConfig;