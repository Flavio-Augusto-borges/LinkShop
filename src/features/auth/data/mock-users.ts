import type { MockUserRecord } from "@/features/auth/types/auth.types";

export const mockUsers: MockUserRecord[] = [
  {
    id: "user-admin-1",
    name: "Equipe LinkShop",
    email: "admin@linkshop.dev",
    password: "123456",
    role: "admin",
    createdAt: "2026-03-01T10:00:00.000Z"
  },
  {
    id: "user-1",
    name: "Usuario Demo",
    email: "user@linkshop.dev",
    password: "123456",
    role: "user",
    createdAt: "2026-03-02T10:00:00.000Z"
  }
];
