import { z } from "zod";
import { userRoles } from "@/db/schema/enums";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const inviteUserSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(80),
  role: z.enum(userRoles),
  password: passwordSchema,
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  role: z.enum(userRoles),
  temporaryPassword: passwordSchema,
});

export const updateUserRoleSchema = z.object({
  id: z.string().min(1),
  role: z.enum(userRoles),
});

export const setUserDisabledSchema = z.object({
  id: z.string().min(1),
  disabled: z.boolean(),
});

export const resetUserPasswordSchema = z.object({
  id: z.string().min(1),
  temporaryPassword: passwordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type SetUserDisabledInput = z.infer<typeof setUserDisabledSchema>;
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
