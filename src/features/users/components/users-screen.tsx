"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DotsThree, Plus } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userRoles, type UserRole } from "@/db/schema/enums";
import { formatKarachiDateTime } from "@/lib/datetime";
import { errorMessage } from "@/lib/errors";
import {
  createUser,
  resetUserPassword,
  setUserDisabled,
  updateUserRole,
} from "../actions";
import {
  createUserSchema,
  resetUserPasswordSchema,
  type CreateUserInput,
} from "../schema";
import type { UserRow } from "../queries";

interface UsersScreenProps {
  users: UserRow[];
  currentUserId: string;
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

function roleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "INVENTORY_MANAGER":
      return "Inventory Manager";
    case "SALES":
      return "Sales";
    default:
      return role.replaceAll("_", " ");
  }
}

function roleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return <Badge tone="primary">{roleLabel(role)}</Badge>;
    case "INVENTORY_MANAGER":
      return <Badge tone="accent">{roleLabel(role)}</Badge>;
    default:
      return <Badge tone="muted">{roleLabel(role)}</Badge>;
  }
}

type DialogState =
  | { type: "create" }
  | { type: "role"; user: UserRow }
  | { type: "disable"; user: UserRow }
  | { type: "reset"; user: UserRow }
  | null;

export function UsersScreen({ users, currentUserId }: UsersScreenProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [pending, setPending] = useState(false);
  const [roleValue, setRoleValue] = useState<UserRole>("SALES");
  const [createRole, setCreateRole] = useState<UserRole>("SALES");

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "SALES",
      temporaryPassword: "",
    },
  });

  const resetForm = useForm<{ temporaryPassword: string }>({
    resolver: zodResolver(resetUserPasswordSchema.pick({ temporaryPassword: true })),
    defaultValues: { temporaryPassword: "" },
  });

  const activeCount = useMemo(() => users.filter((row) => !row.disabled).length, [users]);

  function closeDialog() {
    setDialog(null);
    createForm.reset();
    resetForm.reset();
    setPending(false);
  }

  async function run(task: () => Promise<unknown>, success: string) {
    setPending(true);
    try {
      await task();
      toast.success(success);
      closeDialog();
    } catch (error) {
      toast.error(errorMessage(error));
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">Users</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Staff accounts, roles, and sign-in status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] text-ink-muted tabular-nums">
            {activeCount} active
          </span>
          <Button variant="secondary" size="md" asChild>
            <a href="/api/export/full">Full export</a>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              createForm.reset({
                name: "",
                email: "",
                role: "SALES",
                temporaryPassword: "",
              });
              setCreateRole("SALES");
              setDialog({ type: "create" });
            }}
          >
            <Plus weight="light" className="size-3.5" />
            New user
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="h-9 border-b border-line-strong bg-subtle/40 text-left text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              <th className="px-4">Name</th>
              <th className="px-4">Email</th>
              <th className="px-4">Role</th>
              <th className="px-4">Status</th>
              <th className="px-4 text-right">Last login</th>
              <th className="w-12 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((row) => {
              const isSelf = row.id === currentUserId;
              return (
                <tr
                  key={row.id}
                  className="group h-12 transition-colors hover:bg-subtle/50"
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-subtle text-[12px] font-semibold text-primary">
                        {getInitials(row.name)}
                      </div>
                      <span className="truncate font-medium text-ink">{row.name}</span>
                    </div>
                  </td>
                  <td className="truncate px-4 py-2 font-mono text-[12px] text-ink-muted">
                    {row.email}
                  </td>
                  <td className="px-4 py-2">{roleBadge(row.role)}</td>
                  <td className="px-4 py-2">
                    {row.disabled ? (
                      <Badge tone="sold">Disabled</Badge>
                    ) : (
                      <Badge tone="available">Active</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-[12px] text-ink-muted tabular-nums">
                    {row.lastLoginAt ? formatKarachiDateTime(row.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${row.name}`}
                          className="flex size-7 items-center justify-center rounded text-ink-muted opacity-70 group-hover:opacity-100 hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                        >
                          <DotsThree weight="bold" className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          disabled={isSelf}
                          onClick={() => {
                            setRoleValue(row.role);
                            setDialog({ type: "role", user: row });
                          }}
                        >
                          Edit role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isSelf}
                          onClick={() => setDialog({ type: "disable", user: row })}
                        >
                          {row.disabled ? "Enable" : "Disable"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            resetForm.reset({ temporaryPassword: "" });
                            setDialog({ type: "reset", user: row });
                          }}
                        >
                          Reset password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialog?.type === "create"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>
              They will sign in with this temporary password and must change it
              immediately.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={createForm.handleSubmit((values) =>
              run(() => createUser(values), `Created ${values.name}`),
            )}
          >
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" autoFocus {...createForm.register("name")} />
              {createForm.formState.errors.name ? (
                <p className="text-[11px] text-sold">
                  {createForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" {...createForm.register("email")} />
              {createForm.formState.errors.email ? (
                <p className="text-[11px] text-sold">
                  {createForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={createRole}
                onValueChange={(value) => {
                  const role = value as UserRole;
                  setCreateRole(role);
                  createForm.setValue("role", role);
                }}
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-password">Temporary password</Label>
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                {...createForm.register("temporaryPassword")}
              />
              {createForm.formState.errors.temporaryPassword ? (
                <p className="text-[11px] text-sold">
                  {createForm.formState.errors.temporaryPassword.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={pending}>
                Create user
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.type === "role"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>
              {dialog?.type === "role" ? `Change access for ${dialog.user.name}.` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={roleValue}
              onValueChange={(value) => setRoleValue(value as UserRole)}
            >
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={pending}
                onClick={() => {
                  if (dialog?.type !== "role") return;
                  void run(
                    () => updateUserRole({ id: dialog.user.id, role: roleValue }),
                    `Updated role for ${dialog.user.name}`,
                  );
                }}
              >
                Save role
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.type === "disable"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "disable" && dialog.user.disabled
                ? "Enable user"
                : "Disable user"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.type === "disable" && dialog.user.disabled
                ? `${dialog.user.name} will be able to sign in again.`
                : `${dialog?.type === "disable" ? dialog.user.name : "This user"} will not be able to sign in. Open sessions will be revoked.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                dialog?.type === "disable" && !dialog.user.disabled ? "danger" : "primary"
              }
              loading={pending}
              onClick={() => {
                if (dialog?.type !== "disable") return;
                const next = !dialog.user.disabled;
                void run(
                  () => setUserDisabled({ id: dialog.user.id, disabled: next }),
                  next ? `Disabled ${dialog.user.name}` : `Enabled ${dialog.user.name}`,
                );
              }}
            >
              {dialog?.type === "disable" && dialog.user.disabled ? "Enable" : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog?.type === "reset"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              {dialog?.type === "reset"
                ? `${dialog.user.name} must change this temporary password at next sign-in. Current sessions will be revoked.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={resetForm.handleSubmit((values) => {
              if (dialog?.type !== "reset") return;
              void run(
                () =>
                  resetUserPassword({
                    id: dialog.user.id,
                    temporaryPassword: values.temporaryPassword,
                  }),
                `Password reset for ${dialog.user.name}`,
              );
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">Temporary password</Label>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                {...resetForm.register("temporaryPassword")}
              />
              {resetForm.formState.errors.temporaryPassword ? (
                <p className="text-[11px] text-sold">
                  {resetForm.formState.errors.temporaryPassword.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={pending}>
                Reset password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
