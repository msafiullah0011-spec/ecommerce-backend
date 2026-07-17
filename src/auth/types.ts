import type { Role } from '../../generated/prisma/enums.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
