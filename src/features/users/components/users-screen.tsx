"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  DotsThree,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  UserCheck,
  Users as UsersIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { Pill, StatusDot } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
      return <Pill tone="blue">{roleLabel(role)}</Pill>;
    case "INVENTORY_MANAGER":
      return <Pill tone="neutral">{roleLabel(role)}</Pill>;
    default:
      return <Pill tone="muted">{roleLabel(role)}</Pill>;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

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
  const adminCount = useMemo(
    () => users.filter((row) => row.role === "ADMIN").length,
    [users],
  );
  const inventoryCount = useMemo(
    () => users.filter((row) => row.role === "INVENTORY_MANAGER").length,
    [users],
  );
  const salesCount = useMemo(
    () => users.filter((row) => row.role === "SALES").length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = user.name.toLowerCase().includes(query);
        const emailMatch = user.email.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

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
      <PageHeader
        title="Users"
        description="Staff accounts, roles, and sign-in status."
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-[6px] bg-primary-soft px-2.5 py-1 font-sans text-[12px] font-medium text-primary tabular-nums">
              {activeCount} active
            </span>
            <Button variant="secondary" size="md" asChild>
              <a href="/api/export/full">Full export</a>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Plus weight="regular" className="size-4" />}
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
              New user
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column (8 cols): Users Table & Filter Toolbar */}
        <div className="space-y-4 lg:col-span-8">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xs">
              <MagnifyingGlass
                weight="regular"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-[13px]"
              />
            </div>

            <SegmentedControl
              value={roleFilter}
              onValueChange={setRoleFilter}
              options={[
                { value: "ALL", label: `All (${users.length})` },
                { value: "ADMIN", label: `Admin (${adminCount})` },
                { value: "INVENTORY_MANAGER", label: `Inventory (${inventoryCount})` },
                { value: "SALES", label: `Sales (${salesCount})` },
              ]}
              size="sm"
            />
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="h-[38px] border-b border-line bg-[#FAFBFC] text-left text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                  <th className="px-4">Name</th>
                  <th className="px-4">Role</th>
                  <th className="px-4">Status</th>
                  <th className="px-4 text-right">Last login</th>
                  <th className="w-12 px-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="h-32 text-center text-[13px] text-ink-muted"
                    >
                      No users match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((row) => {
                    const isSelf = row.id === currentUserId;
                    return (
                      <tr
                        key={row.id}
                        className="group h-[44px] transition-colors hover:bg-subtle/50"
                      >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-subtle text-[11px] font-semibold text-primary">
                              {getInitials(row.name)}
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate font-medium text-ink">
                                {row.name}
                                {isSelf && (
                                  <span className="ml-1.5 rounded bg-subtle px-1.5 py-0.5 text-[10.5px] font-medium text-ink-muted">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="block truncate font-sans text-[12px] text-ink-muted">
                                {row.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {roleBadge(row.role)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {row.disabled ? (
                            <Pill tone="bad">
                              <StatusDot status="SOLD">Disabled</StatusDot>
                            </Pill>
                          ) : (
                            <Pill tone="ok">
                              <StatusDot status="AVAILABLE">Active</StatusDot>
                            </Pill>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-sans text-[12px] whitespace-nowrap text-ink-muted tabular-nums">
                          {row.lastLoginAt
                            ? formatKarachiDateTime(row.lastLoginAt)
                            : "Never"}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Actions for ${row.name}`}
                                className="flex size-7 items-center justify-center rounded-[6px] text-ink-muted transition-colors hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                              >
                                <DotsThree weight="bold" className="size-4" />
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column (4 cols): Roles & Access Explainer */}
        <div className="space-y-4 lg:col-span-4">
          <Panel title="Roles & Access" hint="System permission scopes for team members">
            <div className="divide-y divide-line">
              <div className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck weight="regular" className="size-4 text-primary" />
                    <span className="font-semibold text-ink">Administrator</span>
                  </div>
                  <span className="rounded bg-primary-soft px-2 py-0.5 font-sans text-[11px] font-medium text-primary tabular-nums">
                    {adminCount} {adminCount === 1 ? "user" : "users"}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                  Full system access. Manage staff accounts, system settings, financial
                  adjustments, discounts, and approvals.
                </p>
              </div>

              <div className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UsersIcon weight="regular" className="size-4 text-ink-muted" />
                    <span className="font-semibold text-ink">Inventory Manager</span>
                  </div>
                  <span className="rounded bg-subtle px-2 py-0.5 font-sans text-[11px] font-medium text-ink-muted tabular-nums">
                    {inventoryCount} {inventoryCount === 1 ? "user" : "users"}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                  Unit catalog management, floor rate configurations, data imports,
                  structure updates, and inventory summaries.
                </p>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck weight="regular" className="size-4 text-ok" />
                    <span className="font-semibold text-ink">Sales</span>
                  </div>
                  <span className="rounded bg-ok-soft px-2 py-0.5 font-sans text-[11px] font-medium text-ok tabular-nums">
                    {salesCount} {salesCount === 1 ? "user" : "users"}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                  Daily sales operations. Search inventory, create reservations and
                  bookings, record installments, and issue receipts.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Create User Dialog */}
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

      {/* Edit Role Dialog */}
      <Dialog
        open={dialog?.type === "role"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>
              {dialog?.type === "role"
                ? `Change access level for ${dialog.user.name}.`
                : null}
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

      {/* Disable/Enable Dialog */}
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

      {/* Reset Password Dialog */}
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
