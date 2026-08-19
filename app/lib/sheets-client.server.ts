import { google } from "googleapis";

/**
 * Cliente autenticado contra la Google Sheets API vía cuenta de servicio.
 * Requiere GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_KEY en el
 * .env (ver instructivo — sección "Credenciales de Google").
 *
 * IMPORTANTE: esta es una cuenta de servicio distinta del login con Google
 * de los usuarios — no comparten credenciales. La cuenta de servicio solo
 * necesita acceso de LECTOR al Sheet.
 */
function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) {
    throw new Error(
      "Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY en el .env"
    );
  }
  // La clave privada viene con \n literales cuando se pega en un .env de una línea.
  return { email, key: key.replace(/\\n/g, "\n") };
}

export function getSheetsClient() {
  const { email, key } = getCredentials();
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export const SPREADSHEET_ID =
  process.env.GOOGLE_SHEET_ID ?? "19cweg9zeHE0LT1p22xW30C_7JJoBD8BAXUtUKqYFcNQ";

/** Lee todas las filas de una pestaña desde `fromRow` (1-indexed) en adelante. */
export async function readSheetRange(
  tabName: string,
  fromRow: number,
  lastColumn: string
) {
  const sheets = getSheetsClient();
  const range = `${tabName}!A${fromRow}:${lastColumn}`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
    // UNFORMATTED_VALUE + SERIAL_NUMBER: las fechas llegan como número de
    // serie de Sheets (días desde 1899-12-30), no como string localizado
    // ambiguo (7/6 → ¿6 de julio o 7 de junio?). Se convierte en sync.server.ts.
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return res.data.values ?? [];
}
