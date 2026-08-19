import type { Source } from "~/db/schema";

/**
 * Mapeo de columnas por pestaña, tomado de los encabezados reales
 * observados en el Google Sheet (fila 1 de cada pestaña). Índices 0-based,
 * relativos al rango leído (siempre A:{lastColumn}).
 *
 * ⚠️ "sii" es la excepción: en la exploración del archivo no llegué a ver
 * las columnas "Glosa Type" / "Glosa Vendor" / "Tracker" de esa pestaña
 * (mi lectura se cortó en la columna N). Dejé una posición tentativa
 * (O, P, Q) que HAY QUE CONFIRMAR contra el Sheet real antes de sincronizar
 * SII por primera vez — si está mal, el sync va a leer basura en esas
 * columnas en vez de fallar ruidosamente, así que no lo prendría sin
 * confirmar esto primero.
 */
export type SourceConfig = {
  tab: string;
  lastColumn: string;
  dataStartRow: number;
  columns: {
    fecha: number;
    monto: number;
    glosaType: number;
    glosaVendor: number;
  };
  /** Contraparte usada para buscar coincidencias de glosa (sección 6). */
  contraparte: { rut?: number; nombre?: number };
  /** Resto de columnas propias de la fuente -> campo de la tabla *_detalle. */
  detalle: Record<string, number>;
};

export const SOURCE_CONFIG: Record<Source, SourceConfig> = {
  cc: {
    tab: "CC",
    lastColumn: "N",
    dataStartRow: 2,
    columns: { fecha: 2, monto: 0, glosaType: 8, glosaVendor: 9 },
    contraparte: { rut: 12 },
    detalle: {
      descripcionMovimiento: 1,
      saldo: 3,
      nDocumento: 4,
      sucursal: 5,
      cargoAbono: 6,
      rutExtraido: 12,
      comentario: 11,
      // "Proveedor" (col 13) es un VLOOKUP contra la hoja Proveedores — se
      // resuelve del lado de Entity con la tabla `proveedores`, no se copia tal cual.
    },
  },
  tc: {
    tab: "TC",
    lastColumn: "I",
    dataStartRow: 2,
    columns: { fecha: 0, monto: 3, glosaType: 6, glosaVendor: 7 },
    contraparte: { nombre: 1 }, // ESTABLECIMIENTO
    detalle: { establecimiento: 1, descripcion: 2, lugar: 4 },
  },
  bh: {
    tab: "BH",
    lastColumn: "N",
    dataStartRow: 2,
    columns: { fecha: 1, monto: 10, glosaType: 11, glosaVendor: 12 },
    contraparte: { rut: 4, nombre: 5 },
    detalle: {
      numeroBoleta: 0,
      estado: 2,
      fechaAnulacion: 3,
      rut: 4,
      razonSocial: 5,
      socProf: 6,
      brutos: 7,
      retenido: 8,
      pagado: 9,
    },
  },
  sii: {
    tab: "SII",
    lastColumn: "Q", // ⚠️ tentativo, ver nota arriba
    dataStartRow: 2,
    columns: { fecha: 6, monto: 10, glosaType: 14, glosaVendor: 15 }, // ⚠️ tentativo
    contraparte: { rut: 3, nombre: 4 },
    detalle: {
      tipoDoc: 1,
      tipoCompra: 2,
      rutProveedor: 3,
      razonSocial: 4,
      folio: 5,
      fechaRecepcion: 7,
      fechaAcuse: 8,
      montoExento: 9,
      montoNeto: 10,
      montoIvaRecuperable: 11,
      montoIvaNoRecuperable: 12,
    },
  },
  mepa: {
    tab: "MePa",
    lastColumn: "L",
    dataStartRow: 2,
    columns: { fecha: 0, monto: 7, glosaType: 8, glosaVendor: 9 },
    contraparte: { nombre: 2 }, // Transacción (descripción)
    detalle: { tipo: 1, transaccion: 2, externalId: 3, moneda: 4, comision: 6 },
  },
  g66: {
    tab: "G66-CLP",
    lastColumn: "N",
    dataStartRow: 2,
    columns: { fecha: 1, monto: 8, glosaType: 9, glosaVendor: 10 },
    contraparte: { nombre: 7 }, // Nombre tercero o Comercio
    detalle: { tipoTransaccion: 0, nombreTercero: 7, cargo: 2, abono: 3 },
  },
};
