import ExcelJS from "exceljs";

function sheetFromRows(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Record<string, unknown>[],
) {
  const worksheet = workbook.addWorksheet(name);
  if (rows.length === 0) {
    worksheet.addRow(["(no rows)"]);
    return;
  }
  const keys = Object.keys(rows[0] ?? {});
  worksheet.columns = keys.map((key) => ({ header: key, key, width: 18 }));
  for (const row of rows) {
    const mapped: Record<string, unknown> = {};
    for (const key of keys) {
      const value = row[key];
      mapped[key] =
        value instanceof Date
          ? value.toISOString()
          : value === null || value === undefined
            ? ""
            : value;
    }
    worksheet.addRow(mapped);
  }
}

export async function workbookToBuffer(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sardar's Mall ERP";
  workbook.created = new Date();
  for (const sheet of sheets) {
    sheetFromRows(workbook, sheet.name.slice(0, 31), sheet.rows);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
