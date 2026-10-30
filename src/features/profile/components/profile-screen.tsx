"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { changeOwnPassword, updateOwnName } from "../actions";
import {
  changeOwnPasswordSchema,
  updateOwnNameSchema,
  type ChangeOwnPasswordInput,
  type UpdateOwnNameInput,
} from "../schema";

interface ProfileScreenProps {
  name: string;
  email: string;
  mustChangePassword: boolean;
}

export function ProfileScreen({ name, email, mustChangePassword }: ProfileScreenProps) {
  const nameForm = useForm<UpdateOwnNameInput>({
    resolver: zodResolver(updateOwnNameSchema),
    defaultValues: { name },
  });
  const passwordForm = useForm<ChangeOwnPasswordInput>({
    resolver: zodResolver(changeOwnPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <div className="border-b border-line pb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">Profile</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          {mustChangePassword
            ? "Set a new password before using the ledger."
            : "Your name and password."}
        </p>
      </div>

      <section className="space-y-4 rounded-[8px] border border-line bg-surface p-5">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Name</h2>
          <p className="text-[12px] text-ink-muted">{email}</p>
        </div>
        <form
          className="space-y-3"
          onSubmit={nameForm.handleSubmit(async (values) => {
            try {
              const result = await updateOwnName(values);
              toast.success("Name updated");
              nameForm.reset({ name: result.name });
            } catch (error) {
              toast.error(errorMessage(error));
            }
          })}
        >
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Display name</Label>
            <Input id="profile-name" {...nameForm.register("name")} />
            {nameForm.formState.errors.name ? (
              <p className="text-[11px] text-sold">
                {nameForm.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            variant="secondary"
            loading={nameForm.formState.isSubmitting}
          >
            Save name
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-[8px] border border-line bg-surface p-5">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Password</h2>
          <p className="text-[12px] text-ink-muted">
            {mustChangePassword
              ? "Enter the temporary password, then choose a new one of at least 8 characters."
              : "Current password is required to set a new one."}
          </p>
        </div>
        <form
          className="space-y-3"
          onSubmit={passwordForm.handleSubmit(async (values) => {
            try {
              await changeOwnPassword(values);
              toast.success("Password updated");
              passwordForm.reset({ currentPassword: "", newPassword: "" });
            } catch (error) {
              toast.error(errorMessage(error));
            }
          })}
        >
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              {...passwordForm.register("currentPassword")}
            />
            {passwordForm.formState.errors.currentPassword ? (
              <p className="text-[11px] text-sold">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register("newPassword")}
            />
            {passwordForm.formState.errors.newPassword ? (
              <p className="text-[11px] text-sold">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={passwordForm.formState.isSubmitting}
          >
            Update password
          </Button>
        </form>
      </section>
    </div>
  );
}
