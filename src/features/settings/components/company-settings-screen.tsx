"use client";

import * as React from "react";
import { Plus, Trash, Check, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/ui/form-section";
import { Pill, StatusDot } from "@/components/ui/badge";
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
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Company"
        description="Bank details and authorized signatories used on down payment receipts."
        actions={
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => void handleSave()}
            loading={saving}
          >
            Save changes
          </Button>
        }
      />

      <div className="rounded-[8px] border border-line bg-surface p-6">
        <FormSection
          title="Company bank account"
          description="Account details printed on down payment receipts and bank deposit instructions."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="bank-name" className="text-[12px] font-medium text-ink">
                Bank name
              </Label>
              <Input
                id="bank-name"
                placeholder="e.g. Meezan Bank Limited"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-title" className="text-[12px] font-medium text-ink">
                Account title
              </Label>
              <Input
                id="account-title"
                placeholder="e.g. Sardar's Mall (Pvt) Ltd"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iban" className="text-[12px] font-medium text-ink">
                IBAN
              </Label>
              <Input
                id="iban"
                placeholder="PK00MEZN0000000000000000"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                className="font-sans font-medium tracking-wide uppercase"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Authorised signatories"
          description="Designated signatories who are authorized to sign official booking receipts and certificates."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-muted">
                {rows.length} {rows.length === 1 ? "signatory" : "signatories"} configured
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={<Plus weight="regular" className="size-4" />}
                onClick={() =>
                  setRows((prev) => [
                    ...prev,
                    { name: "", designation: "", sortOrder: prev.length, isActive: true },
                  ])
                }
              >
                Add signatory
              </Button>
            </div>

            <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="h-[38px] border-b border-line bg-[#FAFBFC] text-left text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                    <th className="px-4">Name</th>
                    <th className="px-4">Designation</th>
                    <th className="w-32 px-4">Status</th>
                    <th className="w-16 px-2 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row, index) => (
                    <tr
                      key={row.id ?? `new-${index}`}
                      className="group h-[52px] transition-colors hover:bg-subtle/40"
                    >
                      <td className="px-4 py-2">
                        <Input
                          placeholder="Full name"
                          value={row.name}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, name: e.target.value } : item,
                              ),
                            )
                          }
                          className="h-8.5 text-[13px]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          placeholder="e.g. Director / Chief Executive"
                          value={row.designation}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, designation: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="h-8.5 text-[13px]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, isActive: !item.isActive }
                                  : item,
                              ),
                            )
                          }
                          className="inline-flex cursor-pointer items-center rounded-full transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                          title="Click to toggle active status"
                        >
                          {row.isActive ? (
                            <Pill tone="ok">
                              <StatusDot status="AVAILABLE">Active</StatusDot>
                            </Pill>
                          ) : (
                            <Pill tone="muted">
                              <StatusDot status="PENDING">Inactive</StatusDot>
                            </Pill>
                          )}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={rows.length <= 1}
                          onClick={() =>
                            setRows((prev) => prev.filter((_, i) => i !== index))
                          }
                          aria-label={`Remove ${row.name || "signatory"}`}
                          className="size-8 text-ink-muted hover:text-bad"
                        >
                          <Trash weight="regular" className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
