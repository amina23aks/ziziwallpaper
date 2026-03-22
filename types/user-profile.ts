export type UserRole = "guest" | "user" | "admin";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: Exclude<UserRole, "guest">;
  profileCompleted?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};
