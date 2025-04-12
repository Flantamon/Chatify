/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { ROLES_KEY } from 'src/shared/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Получаем список требуемых ролей из декоратора @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Если роли не указаны - доступ разрешен
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Получаем пользователя из запроса
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Проверяем наличие пользователя и его роли
    if (!user || !user.role) {
      return false;
    }

    // Проверяем, есть ли у пользователя нужная роль
    return requiredRoles.some((role) => user.role === role);
  }
}
