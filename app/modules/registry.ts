/**
 * Registro de módulos — fuente única de verdad para la navegación,
 * el layout y la coordinación entre chats.
 *
 * Cada módulo nuevo agrega su entrada aquí. No tocar este archivo
 * sin avisar al equipo (es compartido por todos los módulos).
 */

export type ModuleDef = {
  slug: string;
  nombre: string;
  rama: string;
  dueño: string;
  prefijoTabla: string;
  prefijoTag: string;
  prefijoRuta: string;
  estado: "activo" | "pendiente" | "diseño";
  credenciales: string[];
};

export const modules: ModuleDef[] = [
  {
    slug: "main",
    nombre: "Main (Infraestructura)",
    rama: "main",
    dueño: "Noe",
    prefijoTabla: "",
    prefijoTag: "",
    prefijoRuta: "",
    estado: "activo",
    credenciales: ["Google OAuth", "Google Service Account"],
  },
  {
    slug: "finanzas",
    nombre: "Finanzas (Conciliación)",
    rama: "main",
    dueño: "Germán",
    prefijoTabla: "",
    prefijoTag: "un:",
    prefijoRuta: "finanzas",
    estado: "activo",
    credenciales: ["Google Sheet (lectura)"],
  },
  {
    slug: "abc",
    nombre: "ABC (Clasificación SKU)",
    rama: "abc",
    dueño: "Germán",
    prefijoTabla: "abc_",
    prefijoTag: "abc:",
    prefijoRuta: "abc",
    estado: "pendiente",
    credenciales: ["Shopify Admin API"],
  },
  {
    slug: "compras",
    nombre: "Compras",
    rama: "compras",
    dueño: "Por definir",
    prefijoTabla: "compras_",
    prefijoTag: "compras:",
    prefijoRuta: "compras",
    estado: "diseño",
    credenciales: [],
  },
  {
    slug: "venta",
    nombre: "Venta",
    rama: "venta",
    dueño: "Por definir",
    prefijoTabla: "venta_",
    prefijoTag: "venta:",
    prefijoRuta: "venta",
    estado: "diseño",
    credenciales: [],
  },
  {
    slug: "estrategias",
    nombre: "Estrategias",
    rama: "estrategias",
    dueño: "Por definir",
    prefijoTabla: "est_",
    prefijoTag: "est:",
    prefijoRuta: "estrategias",
    estado: "diseño",
    credenciales: [],
  },
  {
    slug: "marketing",
    nombre: "Marketing",
    rama: "marketing",
    dueño: "Por definir",
    prefijoTabla: "mkt_",
    prefijoTag: "mkt:",
    prefijoRuta: "marketing",
    estado: "diseño",
    credenciales: [],
  },
  {
    slug: "gestion",
    nombre: "Gestión (KPI)",
    rama: "gestion",
    dueño: "Por definir",
    prefijoTabla: "gest_",
    prefijoTag: "gest:",
    prefijoRuta: "gestion",
    estado: "diseño",
    credenciales: [],
  },
  {
    slug: "licitaciones",
    nombre: "Licitaciones",
    rama: "licitaciones",
    dueño: "Por definir",
    prefijoTabla: "licit_",
    prefijoTag: "licit:",
    prefijoRuta: "licitaciones",
    estado: "diseño",
    credenciales: [],
  },
  {
    slug: "distribuidora",
    nombre: "Distribuidora",
    rama: "distribuidora",
    dueño: "Por definir",
    prefijoTabla: "dist_",
    prefijoTag: "dist:",
    prefijoRuta: "distribuidora",
    estado: "diseño",
    credenciales: [],
  },
];

/** Busca un módulo por su slug. */
export function getModule(slug: string): ModuleDef | undefined {
  return modules.find((m) => m.slug === slug);
}

/** Retorna solo los módulos activos (con rutas visibles). */
export function getActiveModules(): ModuleDef[] {
  return modules.filter((m) => m.estado === "activo");
}
