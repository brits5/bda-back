import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // Si no hay roles requeridos, permitir acceso
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // Verificar que el usuario tenga al menos uno de los roles requeridos
    return requiredRoles.some((role) => user.role === role);
  }
}