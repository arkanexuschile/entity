import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { logout } from "../lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return logout(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

export default function Logout() {
  return null;
}
