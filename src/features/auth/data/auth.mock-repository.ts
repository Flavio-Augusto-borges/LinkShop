import { mockUsers } from "@/features/auth/data/mock-users";
import type { MockUserRecord } from "@/features/auth/types/auth.types";

export const authMockRepository = {
  listUsers() {
    return [...mockUsers];
  },

  findUserByCredentials(email: string, password: string) {
    return (
      mockUsers.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password) ?? null
    );
  },

  findUserByEmail(email: string) {
    return mockUsers.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  findUserById(id: string) {
    return mockUsers.find((item) => item.id === id) ?? null;
  },

  createUser(user: MockUserRecord) {
    mockUsers.push(user);
    return user;
  }
};
