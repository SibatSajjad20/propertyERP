import { type NextRequest, NextResponse } from "next/server";
import {
  generateFloorSummaryCsv,
  generateFloorSummaryExcel,
  generateInventoryCsv,
  generateInventoryExcel,
  generateSoldUnitsCsv,
  generateSoldUnitsExcel,
  getExportFilename,
} from "@/features/dashboard/export";
import {
  getExportFloorSummaryData,
  getExportInventoryData,
  getExportSoldUnitsData,
} from "@/features/dashboard/queries";
import { exportQuerySchema } from "@/features/dashboard/schema";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (
    !can(session.user.role, "dashboard.read") &&
    !can(session.user.role, "units.read")
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = exportQuerySchema.safeParse({
    type: searchParams.get("type"),
    format: searchParams.get("format"),
    propertyId: searchParams.get("propertyId") || undefined,
    blockId: searchParams.get("blockId") || undefined,
  });

  if (!parsed.success) {
    return new NextResponse("Invalid query parameters", { status: 400 });
  }

  const { type, format, propertyId, blockId } = parsed.data;
  const filter = {
    propertyId: propertyId || undefined,
    blockId: blockId || undefined,
  };

  const filename = getExportFilename(type, format);

  if (type === "inventory") {
    const data = await getExportInventoryData(filter);
    if (format === "xlsx") {
      const buffer = await generateInventoryExcel(data);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      const csv = generateInventoryCsv(data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  }

  if (type === "sold") {
    const data = await getExportSoldUnitsData(filter);
    if (format === "xlsx") {
      const buffer = await generateSoldUnitsExcel(data);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      const csv = generateSoldUnitsCsv(data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  }

  if (type === "floors") {
    const data = await getExportFloorSummaryData(filter);
    if (format === "xlsx") {
      const buffer = await generateFloorSummaryExcel(data);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      const csv = generateFloorSummaryCsv(data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  }

  return new NextResponse("Not Found", { status: 404 });
}
