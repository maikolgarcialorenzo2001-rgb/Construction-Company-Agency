import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from './session.service';

/**
 * Protects the working platform children. `login` and `registro` stay open so a
 * visitor can start a demo session; every other platform child redirects to the
 * login screen when there is no session. The marketing table carries no guard.
 */
export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  return session.isAuthenticated() ? true : router.createUrlTree(['/plataforma/login']);
};
