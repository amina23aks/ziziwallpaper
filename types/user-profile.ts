export type UserRole = "user" | "admin";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  profileCompleted?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};
