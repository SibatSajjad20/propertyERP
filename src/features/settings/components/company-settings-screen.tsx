"use client";

import * as React from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { saveCompanySettings } from "../actions";

type SignatoryDraft = {
  id?: string;
  name: string;
  designation: string;
  sortOrder: number;
  isActive: boolean;
};

export function CompanySettingsScreen({
  settings,
  signatories,
}: {
  settings: { bankName: string; accountTitle: string; iban: string };
  signatories: SignatoryDraft[];
}) {
  const [bankName, setBankName] = React.useState(settings.bankName);
  const [accountTitle, setAccountTitle] = React.useState(settings.accountTitle);
  const [iban, setIban] = React.useState(settings.iban);
  const [rows, setRows] = React.useState<SignatoryDraft[]>(
    signatories.length > 0
      ? signatories
      : [{ name: "", designation: "", sortOrder: 0, isActive: true }],
  );
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveCompanySettings({
        bankName,
        accountTitle,
        iban,
        signatories: rows.filter((row) => row.name.trim() && row.designation.trim()),
      });
      toast.success("Company settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company"
        description="Bank details and authorized signatories used on down payment receipts."
      />

      <div className="card space-y-4 p-5">
        <h2 className="text-[14px] font-semibold text-ink">Company bank account</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="bank-name" className="mb-1 block text-[12px]">
              Bank name
            </Label>
            <Input
              id="bank-name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="account-title" className="mb-1 block text-[12px]">
              Account title
            </Label>
            <Input
              id="account-title"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="iban" className="mb-1 block text-[12px]">
              IBAN
            </Label>
            <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-ink">Authorized signatories</h2>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                { name: "", designation: "", sortOrder: prev.length, isActive: true },
              ])
            }
          >
            <Plus weight="light" className="size-4" />
            Add
          </Button>
        </div>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id ?? `new-${index}`}
              className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <Label className="mb-1 block text-[12px]">Name</Label>
                <Input
                  value={row.name}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, name: e.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <Label className="mb-1 block text-[12px]">Designation</Label>
                <Input
                  value={row.designation}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, designation: e.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                  disabled={rows.length <= 1}
                >
                  <Trash weight="light" className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        onClick={() => void handleSave()}
        loading={saving}
      >
        Save settings
      </Button>
    </div>
  );
}
