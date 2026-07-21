import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    const allowed = roles.includes(user?.role);
    if (!allowed) {
      try {
        const userId = user?.id ?? 'unknown';
        const userRole = user?.role ?? 'unknown';
        // eslint-disable-next-line no-console
        console.warn(`[RolesGuard] Access denied — required:[${roles.join(',')}], user:${userId}(${userRole})`);
        // Additional debug: print raw roles array and element types to diagnose mismatches
        try {
          // eslint-disable-next-line no-console
          console.warn('[RolesGuard] roles raw:', JSON.stringify(roles));
        } catch (e) {
          // fallback when roles contains non-serializable entries
          // eslint-disable-next-line no-console
          console.warn('[RolesGuard] roles raw (fallback):', roles);
        }
        // eslint-disable-next-line no-console
        console.warn('[RolesGuard] roles types:', roles.map((r) => `${typeof r}:${String(r)}`).join(','));
      } catch (e) {
        // ignore logging failures
      }
    }
    return allowed;
  }
}
