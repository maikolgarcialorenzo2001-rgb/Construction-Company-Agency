import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import type { Role } from '../domain';
import { SessionService } from './session.service';

/**
 * Role gate for the platform children. It reads the allowed roles from
 * `route.data['roles']` and lets the session through only when its role is
 * listed. A signed-in session with the wrong role is sent back to the platform
 * home; an anonymous visitor goes to the login screen. It is defensive when the
 * allowed list is missing or empty: nothing is allowed, so the redirect follows
 * the session state.
 *
 * Composed after `authGuard` (`canActivate: [authGuard, roleGuard]`): the auth
 * guard short-circuits anonymous visitors, this one narrows by role.
 */
export const roleGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const allowed = (route.data?.['roles'] ?? []) as readonly Role[];
  const role = session.role();

  if (role && allowed.includes(role)) {
    return true;
  }

  return router.createUrlTree([role ? '/plataforma/inicio' : '/plataforma/login']);
};
