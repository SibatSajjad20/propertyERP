"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { errorMessage } from "@/lib/errors";
import { changeOwnPassword, updateOwnName } from "../actions";
import {
  changeOwnPasswordSchema,
  updateOwnNameSchema,
  type UpdateOwnNameInput,
} from "../schema";

interface ProfileScreenProps {
  name: string;
  email: string;
  mustChangePassword: boolean;
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  if (!first) return "U";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1];
  if (!last) return first.slice(0, 2).toUpperCase();
  return (first[0]! + last[0]!).toUpperCase();
}

function computePasswordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "None" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  switch (score) {
    case 1:
      return { score: 1, label: "Weak" };
    case 2:
      return { score: 2, label: "Fair" };
    case 3:
      return { score: 3, label: "Good" };
    case 4:
      return { score: 4, label: "Strong" };
    default:
      return { score: 0, label: "None" };
  }
}

const clientPasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from current password",
  });

type ClientPasswordFormValues = z.infer<typeof clientPasswordFormSchema>;

export function ProfileScreen({ name, email, mustChangePassword }: ProfileScreenProps) {
  const router = useRouter();

  const nameForm = useForm<UpdateOwnNameInput>({
    resolver: zodResolver(updateOwnNameSchema),
    defaultValues: { name },
  });

  const passwordForm = useForm<ClientPasswordFormValues>({
    resolver: zodResolver(clientPasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = passwordForm.watch("newPassword") || "";
  const strength = useMemo(
    () => computePasswordStrength(newPasswordValue),
    [newPasswordValue],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Profile"
        description={
          mustChangePassword
            ? "Set a new password before accessing the sales workspace."
            : "Your personal details, contact email, and security credentials."
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Display Name Section */}
        <Panel
          title="Display name"
          hint="How your name appears on activity logs and client communications"
        >
          <div className="flex items-start gap-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-subtle text-[15px] font-semibold text-primary">
              {getInitials(nameForm.watch("name") || name)}
            </div>

            <form
              className="min-w-0 flex-1 space-y-4"
              onSubmit={nameForm.handleSubmit(async (values) => {
                try {
                  const result = await updateOwnName(values);
                  toast.success("Name updated successfully");
                  nameForm.reset({ name: result.name });
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              })}
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="profile-name"
                  className="text-[12px] font-medium text-ink"
                >
                  Full name
                </Label>
                <Input
                  id="profile-name"
                  {...nameForm.register("name")}
                  className="max-w-md"
                />
                {nameForm.formState.errors.name ? (
                  <p className="text-[11px] text-sold">
                    {nameForm.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="profile-email"
                  className="text-[12px] font-medium text-ink"
                >
                  Email address
                </Label>
                <Input
                  id="profile-email"
                  value={email}
                  disabled
                  className="max-w-md bg-subtle text-ink-muted"
                />
                <p className="text-[11px] text-ink-muted">
                  Email is managed by your system administrator.
                </p>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  loading={nameForm.formState.isSubmitting}
                >
                  Save name
                </Button>
              </div>
            </form>
          </div>
        </Panel>

        {/* Password Section */}
        <Panel
          title="Security & Password"
          hint={
            mustChangePassword
              ? "You must choose a new secure password of at least 8 characters."
              : "Update your password regularly to protect your workspace."
          }
        >
          <form
            className="space-y-4"
            onSubmit={passwordForm.handleSubmit(async (values) => {
              try {
                const result = await changeOwnPassword({
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  passwordForm.setError("newPassword", { message: result.error });
                  return;
                }
                toast.success("Password changed successfully");
                passwordForm.reset({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                if (mustChangePassword) {
                  router.replace("/inventory");
                }
              } catch (error) {
                toast.error(errorMessage(error));
              }
            })}
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="current-password"
                className="text-[12px] font-medium text-ink"
              >
                Current password
              </Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                {...passwordForm.register("currentPassword")}
                className="max-w-md"
              />
              {passwordForm.formState.errors.currentPassword ? (
                <p className="text-[11px] text-sold">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-[12px] font-medium text-ink">
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("newPassword")}
                className="max-w-md"
              />
              {passwordForm.formState.errors.newPassword ? (
                <p className="text-[11px] text-sold">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              ) : null}

              {/* 4-Segment Strength Meter */}
              {newPasswordValue && (
                <div className="max-w-md pt-1.5">
                  <div className="flex h-1.5 gap-1.5">
                    <div
                      className={`h-full flex-1 rounded-full transition-colors ${
                        strength.score >= 1
                          ? strength.score === 1
                            ? "bg-bad"
                            : strength.score === 2
                              ? "bg-[#B54708]"
                              : strength.score === 3
                                ? "bg-primary"
                                : "bg-ok"
                          : "bg-line-strong"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-colors ${
                        strength.score >= 2
                          ? strength.score === 2
                            ? "bg-[#B54708]"
                            : strength.score === 3
                              ? "bg-primary"
                              : "bg-ok"
                          : "bg-line-strong"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-colors ${
                        strength.score >= 3
                          ? strength.score === 3
                            ? "bg-primary"
                            : "bg-ok"
                          : "bg-line-strong"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-colors ${
                        strength.score >= 4 ? "bg-ok" : "bg-line-strong"
                      }`}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>Password strength</span>
                    <span
                      className={`font-medium ${
                        strength.score === 1
                          ? "text-bad"
                          : strength.score === 2
                            ? "text-[#B54708]"
                            : strength.score === 3
                              ? "text-primary"
                              : strength.score === 4
                                ? "text-ok"
                                : "text-ink-muted"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-password"
                className="text-[12px] font-medium text-ink"
              >
                Confirm new password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
                className="max-w-md"
              />
              {passwordForm.formState.errors.confirmPassword ? (
                <p className="text-[11px] text-sold">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={passwordForm.formState.isSubmitting}
              >
                Update password
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
