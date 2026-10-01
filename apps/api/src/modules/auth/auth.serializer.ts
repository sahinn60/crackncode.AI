import type { User } from '@prisma/client';

/**
 * Strips all sensitive fields from a User record before sending to client.
 * Add any new sensitive fields here as the schema grows.
 */
export function sanitizeUser(user: User & Record<string, unknown>) {
  const {
    passwordHash: _ph,
    ...safe
  } = user;
  return safe;
}
