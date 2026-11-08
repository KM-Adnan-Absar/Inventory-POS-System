export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
  STAFF: "STAFF",
} as const;

export const PERMISSIONS = {
  manageUsers: ["SUPER_ADMIN", "ADMIN"],

  manageProducts: [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
  ],

  manageInventory: [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
  ],

  createSale: [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "CASHIER",
  ],

  viewReports: [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
  ],
} as const;

export function hasPermission(
  role: string,
  permission: keyof typeof PERMISSIONS
) {
  return PERMISSIONS[permission].includes(
    role as never
  );
}