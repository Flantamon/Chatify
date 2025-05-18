/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    console.log(
      'RolesGuard: Required roles:',
      requiredRoles,
      context.getHandler(),
      context.getClass(),
    ); // Логируем требуемые роли

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('RolesGuard: User from token:', user); // Логируем пользователя из токена
    console.log('RolesGuard: User role:', user?.role); // Логируем роль пользователя

    if (!user || !user.role) {
      console.log('RolesGuard: User or role missing');
      return false;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    console.log('RolesGuard: Has required role:', hasRole); // Логируем результат проверки
    return hasRole;
  }
}
