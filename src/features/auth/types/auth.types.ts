export type UserRole = "guest" | "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  user: User;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  expiresAt: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export type MockUserRecord = User & {
  password: string;
};

export type DemoAuthAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};
