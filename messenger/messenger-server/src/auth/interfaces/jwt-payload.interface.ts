import { UserRole } from '../../shared/enums/user-role.enum';

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}
