import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para asignar roles a rutas o controladores.
 * Se utiliza junto con el RoleGuard para verificar si un usuario
 * tiene los roles necesarios para acceder a un recurso.
 * 
 * @param roles Los roles necesarios para acceder al recurso
 * @example
 * ```typescript
 * @Roles('admin')
 * @Get('admin-dashboard')
 * async getAdminDashboard() {
 *   return { data: 'Admin dashboard data' };
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);