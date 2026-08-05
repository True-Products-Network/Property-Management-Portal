import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const mfaSchema = z.object({
  code: z.string().length(6, "Please enter the 6-digit code"),
  trustDevice: z.boolean().optional(),
});

export type MfaInput = z.infer<typeof mfaSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const invitationSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type InvitationInput = z.infer<typeof invitationSchema>;

// Portal roles - all 10 standard roles
export const portalRoleSchema = z.enum([
  "ADMIN_USER",
  "PORTFOLIO_MANAGER",
  "ASSOCIATION_MANAGER",
  "PROPERTY_MANAGER",
  "BOARD_MEMBER",
  "VENDOR",
  "RESIDENT",
  "OWNER",
  "STAFF",
  "FINANCE_USER",
]);

export type PortalRole = z.infer<typeof portalRoleSchema>;

// User status
export const userStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "REVOKED",
  "PENDING_INVITE",
]);

export type UserStatus = z.infer<typeof userStatusSchema>;

// Session user
export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  ghlContactId: z.string(),
  roles: z.array(portalRoleSchema),
  mfaEnabled: z.boolean(),
  status: userStatusSchema,
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
