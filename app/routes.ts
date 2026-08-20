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
  ]),
] satisfies RouteConfig;