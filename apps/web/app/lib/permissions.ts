export const MODULES = ["ventas", "compras", "inventario", "finanzas", "campanas", "tareas", "contabilidad", "reportes", "admin", "carritos"] as const;
export type Module = (typeof MODULES)[number];

export const ROLES = ["ADMIN", "MANAGER", "FINANZAS", "BODEGA", "MARKETING", "DISENO", "VENTAS"] as const;

export type Perm = { canView: boolean; canEdit: boolean };

export const ROLE_DEFAULTS: Record<string, Record<string, Perm>> = {
  ADMIN: Object.fromEntries(MODULES.map((m) => [m, { canView: true, canEdit: true }])),
  MANAGER: Object.fromEntries(MODULES.map((m) => [m, { canView: true, canEdit: m !== "admin" }])),
  FINANZAS: { ventas: { canView: true, canEdit: false }, compras: { canView: true, canEdit: true }, inventario: { canView: true, canEdit: false }, finanzas: { canView: true, canEdit: true }, campanas: { canView: false, canEdit: false }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: true, canEdit: true }, reportes: { canView: true, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: false, canEdit: false } },
  BODEGA: { ventas: { canView: false, canEdit: false }, compras: { canView: true, canEdit: false }, inventario: { canView: true, canEdit: true }, finanzas: { canView: false, canEdit: false }, campanas: { canView: false, canEdit: false }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: false, canEdit: false }, reportes: { canView: false, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: false, canEdit: false } },
  MARKETING: { ventas: { canView: true, canEdit: false }, compras: { canView: false, canEdit: false }, inventario: { canView: true, canEdit: false }, finanzas: { canView: false, canEdit: false }, campanas: { canView: true, canEdit: true }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: false, canEdit: false }, reportes: { canView: true, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: true, canEdit: true } },
  DISENO: { ventas: { canView: false, canEdit: false }, compras: { canView: false, canEdit: false }, inventario: { canView: false, canEdit: false }, finanzas: { canView: false, canEdit: false }, campanas: { canView: true, canEdit: false }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: false, canEdit: false }, reportes: { canView: false, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: false, canEdit: false } },
  VENTAS: { ventas: { canView: true, canEdit: true }, compras: { canView: false, canEdit: false }, inventario: { canView: true, canEdit: false }, finanzas: { canView: true, canEdit: false }, campanas: { canView: false, canEdit: false }, tareas: { canView: true, canEdit: true }, contabilidad: { canView: false, canEdit: false }, reportes: { canView: true, canEdit: false }, admin: { canView: false, canEdit: false }, carritos: { canView: true, canEdit: true } },
};

export function getRoleDefault(role: string, module: string): Perm {
  return ROLE_DEFAULTS[role]?.[module] ?? { canView: false, canEdit: false };
}
