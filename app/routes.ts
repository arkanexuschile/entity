import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("components/layout/AppLayout.tsx", [
    index("routes/dashboard.tsx"),
    route("finanzas", "routes/finanzas.tsx"),
    route("abc", "routes/abc.tsx"),
  ]),
] satisfies RouteConfig;
