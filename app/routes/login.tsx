import { useState } from "react";
import type { Route } from "./+types/login";
import { login, createUserSession, getUser } from "~/lib/auth.server";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Entrar — Entity" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const username = form.get("username") as string;
  const password = form.get("password") as string;

  const user = await login(username, password);
  if (!user) {
    return { error: "Credenciales inválidas" };
  }

  return createUserSession(user.id, "/");
}

export default function Login({ actionData }: Route.ComponentProps) {
  const [loading, setLoading] = useState(false);
  const error = actionData && "error" in actionData ? actionData.error : null;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header RPG */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-xs font-mono mb-4">
            &#9876; PiedraBruja &#9876;
          </div>
          <h1 className="text-3xl font-bold text-gray-100 tracking-tight">
            Entity
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Plataforma de controlling y conciliación
          </p>
        </div>

        {/* Card login */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <span className="text-amber-400">&#9654;</span>
              Iniciar Sesión
            </h2>
          </div>

          <form
            method="post"
            onSubmit={() => setLoading(true)}
            className="p-6 space-y-4"
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoFocus
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-400 mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded text-sm transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-6">
          Entity v0.1.0 — PiedraBruja
        </p>
      </div>
    </div>
  );
}
