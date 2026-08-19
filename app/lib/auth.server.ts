import { createCookieSessionStorage, redirect } from "react-router";
import bcrypt from "bcryptjs";
import { db } from "~/db/client.server";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";

const SESSION_SECRET = process.env.SESSION_SECRET || "entity-dev-secret-change-me";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_entity_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request): Promise<number | null> {
  const session = await getSession(request);
  const userId = session.get("userId");
  return typeof userId === "number" ? userId : null;
}

export async function requireUserId(request: Request): Promise<number> {
  const userId = await getUserId(request);
  if (!userId) {
    throw redirect("/login");
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return null;
  return { id: user.id, username: user.username, nombre: user.nombre, role: user.role };
}

export async function login(username: string, password: string) {
  const user = db.select().from(users).where(eq(users.username, username)).get();
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, username: user.username, nombre: user.nombre, role: user.role };
}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
