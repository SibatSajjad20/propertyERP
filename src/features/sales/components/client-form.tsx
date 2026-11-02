/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { MagnifyingGlass, CheckCircle, UserCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findClientByCnic } from "../actions";
import type { ClientInput, NextOfKinInput } from "../schema";

interface ClientFormProps {
  client: ClientInput;
  nextOfKin?: NextOfKinInput;
  onChangeClient: (client: ClientInput) => void;
  onChangeNextOfKin?: (kin: NextOfKinInput) => void;
  showNextOfKin?: boolean;
}

export function formatCnicInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) {
    return digits;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function ClientForm({
  client,
  nextOfKin,
  onChangeClient,
  onChangeNextOfKin,
  showNextOfKin = true,
}: ClientFormProps) {
  const [sameAsHome, setSameAsHome] = React.useState(
    Boolean(client.homeAddress && client.homeAddress === client.postalAddress),
  );
  const [isSearching, setIsSearching] = React.useState(false);
  const [foundClient, setFoundClient] = React.useState(false);

  const clientCnicDigits = (client.cnic || "").replace(/\D/g, "").length;
  const kinCnicDigits = (nextOfKin?.cnic || "").replace(/\D/g, "").length;

  async function handleSearchCnic() {
    const cnic = client.cnic.trim();
    if (!cnic) return;
    setIsSearching(true);
    try {
      const result = await findClientByCnic(cnic);
      if (result?.client) {
        setFoundClient(true);
        onChangeClient({
          fullName: result.client.fullName,
          cnic: result.client.cnic,
          phone: result.client.phone,
          email: result.client.email || "",
          homeAddress: result.client.homeAddress,
          postalAddress: result.client.postalAddress,
        });
        if (result.nextOfKin && onChangeNextOfKin) {
          onChangeNextOfKin({
            name: result.nextOfKin.name,
            relation: result.nextOfKin.relation,
            cnic: result.nextOfKin.cnic || "",
            phone: result.nextOfKin.phone,
            address: result.nextOfKin.address || "",
          });
        }
      } else {
        setFoundClient(false);
      }
    } catch (err) {
      console.error("Failed to search CNIC:", err);
    } finally {
      setIsSearching(false);
    }
  }

  function handleHomeAddressChange(val: string) {
    onChangeClient({
      ...client,
      homeAddress: val,
      postalAddress: sameAsHome ? val : client.postalAddress,
    });
  }

  function handleSameAsHomeChange(checked: boolean) {
    setSameAsHome(checked);
    if (checked) {
      onChangeClient({
        ...client,
        postalAddress: client.homeAddress,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Client Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">Client Information</h3>
            <p className="text-[12px] text-ink-muted">
              Enter client CNIC to search and autofill existing records.
            </p>
          </div>
          {foundClient && (
            <span className="inline-flex items-center gap-1 rounded bg-[color-mix(in_srgb,var(--available)_10%,transparent)] px-2 py-0.5 text-[11px] font-medium text-available">
              <UserCheck weight="bold" className="size-3.5" />
              Existing Client Loaded
            </span>
          )}
        </div>

        {/* CNIC Lookup Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="client-cnic" className="mb-1 block text-[12px]">
              CNIC <span className="text-sold">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="client-cnic"
                value={client.cnic}
                onChange={(e) => {
                  const formatted = formatCnicInput(e.target.value);
                  onChangeClient({ ...client, cnic: formatted });
                  setFoundClient(false);
                }}
                maxLength={15}
                placeholder="12345-1234567-1"
                className="font-mono text-[13px]"
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleSearchCnic}
                disabled={isSearching || !client.cnic.trim()}
              >
                <MagnifyingGlass weight="light" className="mr-1 size-3.5" />
                {isSearching ? "..." : "Lookup"}
              </Button>
            </div>
            {client.cnic.trim() ? (
              <p
                className={
                  clientCnicDigits === 13
                    ? "mt-1 text-[11px] font-medium text-available"
                    : "mt-1 text-[11px] font-medium text-sold"
                }
              >
                {clientCnicDigits === 13
                  ? "✓ Valid 13-digit CNIC"
                  : `${clientCnicDigits} of 13 digits entered (format: 12345-1234567-1)`}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-ink-faint">
                Format: 12345-1234567-1 (13 digits)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="client-name" className="mb-1 block text-[12px]">
              Full Name <span className="text-sold">*</span>
            </Label>
            <Input
              id="client-name"
              value={client.fullName}
              onChange={(e) => onChangeClient({ ...client, fullName: e.target.value })}
              placeholder="e.g. Muhammad Tariq"
            />
          </div>
        </div>

        {/* Phone & Email Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="client-phone" className="mb-1 block text-[12px]">
              Phone Number <span className="text-sold">*</span>
            </Label>
            <Input
              id="client-phone"
              value={client.phone}
              onChange={(e) => onChangeClient({ ...client, phone: e.target.value })}
              placeholder="0300-1234567"
              className="tabular-nums"
            />
          </div>

          <div>
            <Label htmlFor="client-email" className="mb-1 block text-[12px]">
              Email Address (Optional)
            </Label>
            <Input
              id="client-email"
              type="email"
              value={client.email || ""}
              onChange={(e) => onChangeClient({ ...client, email: e.target.value })}
              placeholder="client@example.com"
            />
          </div>
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="client-home-address" className="mb-1 block text-[12px]">
              Home Address <span className="text-sold">*</span>
            </Label>
            <Input
              id="client-home-address"
              value={client.homeAddress}
              onChange={(e) => handleHomeAddressChange(e.target.value)}
              placeholder="House/Street, Sector/Block, City"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="client-postal-address" className="text-[12px]">
                Postal / Correspondence Address <span className="text-sold">*</span>
              </Label>
              <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-muted">
                <Checkbox
                  checked={sameAsHome}
                  onCheckedChange={(c) => handleSameAsHomeChange(Boolean(c))}
                />
                Same as home address
              </label>
            </div>
            <Input
              id="client-postal-address"
              value={client.postalAddress}
              onChange={(e) => {
                setSameAsHome(false);
                onChangeClient({ ...client, postalAddress: e.target.value });
              }}
              placeholder="Mailing address for notices and receipts"
              disabled={sameAsHome}
            />
          </div>
        </div>
      </div>

      {/* Next of Kin Section */}
      {showNextOfKin && nextOfKin && onChangeNextOfKin && (
        <div className="space-y-4 pt-2">
          <div className="border-b border-line pb-2">
            <h3 className="text-[14px] font-semibold text-ink">Next of Kin / Nominee</h3>
            <p className="text-[12px] text-ink-muted">
              Emergency contact and legal nominee for the property.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="kin-name" className="mb-1 block text-[12px]">
                Nominee Name <span className="text-sold">*</span>
              </Label>
              <Input
                id="kin-name"
                value={nextOfKin.name}
                onChange={(e) =>
                  onChangeNextOfKin({ ...nextOfKin, name: e.target.value })
                }
                placeholder="e.g. Ayesha Tariq"
              />
            </div>

            <div>
              <Label htmlFor="kin-relation" className="mb-1 block text-[12px]">
                Relationship <span className="text-sold">*</span>
              </Label>
              <Input
                id="kin-relation"
                value={nextOfKin.relation}
                onChange={(e) =>
                  onChangeNextOfKin({ ...nextOfKin, relation: e.target.value })
                }
                placeholder="e.g. Spouse / Son / Brother"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="kin-phone" className="mb-1 block text-[12px]">
                Nominee Phone <span className="text-sold">*</span>
              </Label>
              <Input
                id="kin-phone"
                value={nextOfKin.phone}
                onChange={(e) =>
                  onChangeNextOfKin({ ...nextOfKin, phone: e.target.value })
                }
                placeholder="0300-7654321"
                className="tabular-nums"
              />
            </div>

            <div>
              <Label htmlFor="kin-cnic" className="mb-1 block text-[12px]">
                Nominee CNIC (Optional)
              </Label>
              <Input
                id="kin-cnic"
                value={nextOfKin.cnic || ""}
                onChange={(e) => {
                  const formatted = formatCnicInput(e.target.value);
                  onChangeNextOfKin({ ...nextOfKin, cnic: formatted });
                }}
                maxLength={15}
                placeholder="12345-1234567-2"
                className="font-mono text-[13px]"
              />
              {nextOfKin.cnic?.trim() ? (
                <p
                  className={
                    kinCnicDigits === 13
                      ? "mt-1 text-[11px] font-medium text-available"
                      : "mt-1 text-[11px] font-medium text-sold"
                  }
                >
                  {kinCnicDigits === 13
                    ? "✓ Valid 13-digit CNIC"
                    : `${kinCnicDigits} of 13 digits entered (format: 12345-1234567-1)`}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-ink-faint">
                  Format: 12345-1234567-1 (13 digits, optional)
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="kin-address" className="mb-1 block text-[12px]">
              Nominee Address (Optional)
            </Label>
            <Input
              id="kin-address"
              value={nextOfKin.address || ""}
              onChange={(e) =>
                onChangeNextOfKin({ ...nextOfKin, address: e.target.value })
              }
              placeholder="Address if different from client"
            />
          </div>
        </div>
      )}
    </div>
  );
}
