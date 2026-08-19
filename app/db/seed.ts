import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { trackerCategories } from "./schema";

/**
 * Semilla de tracker_categories a partir de la taxonomía observada en la
 * hoja "Flujo" del Excel de flujo de caja (filas ~3-140).
 *
 * IMPORTANTE — esto es una RECONSTRUCCIÓN, no una lectura exacta: Excel no
 * guarda jerarquía en la fórmula de cada celda (solo en indentación/formato
 * visual que no pude leer vía fórmulas), así que anidé las categorías según
 * el orden de filas y los nombres de sección. Hay que revisarla contra el
 * Google Sheet original antes de darla por buena — especialmente el nivel
 * "Costos Variables > Tiendas" y si "Costos Mercadería" / "Ingresos Ventas
 * Brutas" deberían ser hermanos de Egresos/Ingresos en vez de hijos.
 */

type Node = {
  nombre: string;
  hijos?: Node[];
};

const PRODUCT_TYPES: Node[] = [
  "actividad", "actividadrol", "actividadtcgdigimon", "actividadtcgmtg",
  "actividadtcgop", "actividadtcgotros", "actividadtcgpokemon",
  "actividadtcgvtes", "actividadtcgyugi", "coleccionables", "dados",
  "didacticos", "dnd", "gw", "ingenios", "jdm", "jugueteria", "larp",
  "libreria", "minis", "miniswargame", "pinturas", "rol", "singlemtg",
  "tcgaccarkn", "tcgaccdragonshield", "tcgaccesorios", "tcgaccgg",
  "tcgaccup", "tcgdigimon", "tcggundam", "tcglorcana", "tcgmtg", "tcgop",
  "tcgotros", "tcgpokemon", "tcgriftbound", "tcgvtes", "tcgyugi",
  "unmatched", "xcreditos", "xproductora", "xsnack", "N/A",
].map((nombre) => ({ nombre }));

const TREE: Node[] = [
  {
    nombre: "Ingresos",
    hijos: [{ nombre: "Ingresos Ventas Brutas", hijos: PRODUCT_TYPES }],
  },
  {
    nombre: "Egresos",
    hijos: [
      {
        nombre: "Operación",
        hijos: [
          { nombre: "Marketing" },
          { nombre: "Mercadería" },
          { nombre: "Movimientos de Platas" },
        ],
      },
      { nombre: "Deudas" },
      { nombre: "Devoluciones a clientes" },
      { nombre: "Sueldos" },
      {
        nombre: "ADMINISTRACIÓN",
        hijos: [
          { nombre: "Costos Fijos" },
          {
            nombre: "Costos Variables",
            hijos: [
              {
                nombre: "Tiendas",
                hijos: [
                  { nombre: "Tienda Providencia" },
                  { nombre: "Otras Instalaciones" },
                  { nombre: "Oficina" },
                  { nombre: "E-commerce" },
                  { nombre: "Taller de Pintado" },
                  { nombre: "MESAS" },
                  { nombre: "DISTRIBUIDORES" },
                  { nombre: "LICITACIONES" },
                ],
              },
              { nombre: "LOGÍSTICA Y TRANSPORTE" },
              { nombre: "MOVIMIENTOS DE PLATAS" },
            ],
          },
        ],
      },
      { nombre: "Costos Mercadería", hijos: PRODUCT_TYPES },
    ],
  },
  { nombre: "Balance" },
  { nombre: "Stock Promedio" },
  { nombre: "Crecimiento de Stock" },
];

const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./data/entity.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

let ordenGlobal = 0;

function insertNode(node: Node, parentId: number | null) {
  const orden = ordenGlobal++;
  const result = db
    .insert(trackerCategories)
    .values({ nombre: node.nombre, parentId, orden })
    .run();
  const id = Number(result.lastInsertRowid);
  for (const hijo of node.hijos ?? []) {
    insertNode(hijo, id);
  }
}

db.delete(trackerCategories).run();
for (const raiz of TREE) {
  insertNode(raiz, null);
}

const count = db.select().from(trackerCategories).all().length;
console.log(`Sembradas ${count} categorías (jerarquía reconstruida desde Flujo — revisar antes de usar en producción).`);

sqlite.close();
