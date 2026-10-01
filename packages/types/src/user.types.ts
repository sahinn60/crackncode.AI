export type UserRole = 'user' | 'admin';
export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: PlanTier;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
