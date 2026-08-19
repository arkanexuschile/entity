import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  layout("components/layout/AppLayout.tsx", [
    index("routes/dashboard.tsx"),
    route("finanzas", "routes/finanzas.tsx"),
    route("abc", "routes/abc.tsx"),
    route("shopify-test", "routes/shopify-test.tsx"),
    route("jobs", "routes/jobs.tsx"),
  ]),
] satisfies RouteConfig;
