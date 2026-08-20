import bcrypt from "bcryptjs";
import { redirect } from "react-router";
import { prisma } from "@entity/database";
import { sessionStorage, getUserId } from "./session.server";
import { getRoleDefault } from "./permissions";
import type { Perm } from "./permissions";


// Re-export helpers de sesión para rutas
export { sessionStorage };

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { permissions: true },
  });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}

export async function requireRole(request: Request, roles: string[]) {
  const user = await requireUser(request);
  if (!roles.includes(user.role)) {
    throw redirect("/");
  }
  return user;
}

export async function requireAdmin(request: Request) {
  return requireRole(request, ["ADMIN"]);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function createSessionAndRedirect(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  const cookie = await sessionStorage.commitSession(session);
  return redirect(redirectTo, { headers: { "Set-Cookie": cookie } });
}

export async function logout(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const cookie = await sessionStorage.destroySession(session);
  return redirect("/login", { headers: { "Set-Cookie": cookie } });
}

export type { Perm, Module } from "./permissions";

export async function getUserPermissions(userId: string): Promise<Record<string, Perm>> {
  const rows = await prisma.userModulePermission.findMany({ where: { userId } });
  const map: Record<string, Perm> = {};
  for (const r of rows) map[r.module] = { canView: r.canView, canEdit: r.canEdit };
  return map;
}

export async function canViewModule(user: { id: string; role: string; permissions?: Array<{ module: string; canView: boolean; canEdit: boolean }> }, module: string): Promise<boolean> {
  // Si ya vienen permissions precargadas, usarlas
  if (user.permissions) {
    const p = user.permissions.find((x) => x.module === module);
    if (p) return p.canView;
  } else {
    const perm = await prisma.userModulePermission.findUnique({ where: { userId_module: { userId: user.id, module } } });
    if (perm) return perm.canView;
  }
  return getRoleDefault(user.role, module).canView;
}

export async function canEditModule(user: { id: string; role: string; permissions?: Array<{ module: string; canView: boolean; canEdit: boolean }> }, module: string): Promise<boolean> {
  if (user.permissions) {
    const p = user.permissions.find((x) => x.module === module);
    if (p) return p.canEdit;
  } else {
    const perm = await prisma.userModulePermission.findUnique({ where: { userId_module: { userId: user.id, module } } });
    if (perm) return perm.canEdit;
  }
  return getRoleDefault(user.role, module).canEdit;
}

export async function requireView(request: Request, module: string) {
  const user = await requireUser(request);
  const ok = await canViewModule(user, module);
  if (!ok) throw redirect("/");
  return user;
}

export async function requireEdit(request: Request, module: string) {
  const user = await requireUser(request);
  const ok = await canEditModule(user, module);
  if (!ok) throw redirect("/");
  return user;
}
