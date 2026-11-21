import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';
import { UserRole } from './models';

export const roleGuard: CanActivateFn = route => {
  const session = inject(SessionService); const router = inject(Router);
  const roles = (route.data['roles'] ?? []) as UserRole[];
  return session.isAuthenticated() && (roles.length === 0 || session.hasRole(roles)) ? true : router.createUrlTree(['/login']);
};
