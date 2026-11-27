import { describe, expect, it } from "vitest";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  OverdueNoticePdf,
  type OverdueNoticePdfData,
} from "@/features/reports/pdf/overdue-notice-document";

describe("OverdueNoticePdf", () => {
  it("renders the overdue notice template accurately and outputs valid PDF buffer", async () => {
    const sampleData: OverdueNoticePdfData = {
      noticeNo: "SM/NOT-12234/2026",
      issueDate: "2026-11-27",
      client: {
        title: "Mr",
        fullName: "Muhammad Tariq",
        relationPrefix: "S/O",
        relationName: "Tariq Mehmood",
        cnic: "37405-1234567-1",
        phone: "0300-1234567",
        address: "House 123, Street 4, Sector F-10/2, Islamabad",
      },
      unit: {
        unitCode: "12234",
        floorName: "5th Floor",
        categoryName: "Commercial Retail",
        grossAreaSqft: "3456",
        netAreaSqft: "3456",
        bookingNo: "SM-BK-2026-0045",
        applicationFormNo: "SM-5F-12234-26",
      },
      installment: {
        seq: 1,
        label: "1st Installment",
        milestoneName: "first installment",
        dueDate: "2026-11-15",
        dueAmountPkr: "4,500",
        pendingAmountPkr: "4,500",
        surchargePkr: "0",
        daysOverdue: 12,
      },
      issuedBy: {
        name: "Usman Ghani",
        designation: "Recovery & Accounts Management",
      },
      company: {
        name: "SARDAR'S MALL",
        address: "54-C Iran Road, Block C, near Chandni Chowk, Rawalpindi",
      },
    };

    const buf = await renderToBuffer(<OverdueNoticePdf data={sampleData} />);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("handles clients without relation prefix or custom overrides gracefully", async () => {
    const sampleData: OverdueNoticePdfData = {
      client: {
        fullName: "Valued Client",
      },
      unit: {
        unitCode: "GF-01",
        floorName: "Ground Floor",
      },
      installment: {
        label: "Down Payment",
        dueAmountPkr: "1,500,000",
        pendingAmountPkr: "1,500,000",
      },
      issuedBy: {
        name: "Management",
      },
    };

    const buf = await renderToBuffer(<OverdueNoticePdf data={sampleData} />);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
  });
});
