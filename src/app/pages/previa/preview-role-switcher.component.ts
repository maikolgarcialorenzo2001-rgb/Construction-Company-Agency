import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { SessionService } from '../../core/platform/auth/session.service';
import type { Role } from '../../core/platform/domain';
import { DEMO_ACCOUNTS } from '../../core/platform/mocks/fixtures';
import {
  PREVIEW_ROLES,
  roleLabel as previewRoleLabel,
  type PreviewRole
} from '../../core/platform/preview/preview-fixtures';

/** A seeded demo account as the switcher needs it: credentials stay in state, never in markup. */
interface SwitcherAccount {
  readonly userId: string;
  readonly email: string;
  readonly password: string;
  readonly role: Role;
}

/**
 * The client-only demo-role switcher on the public preview (platform-preview Req
 * "Client-only role switcher").
 *
 * It is client-only because entering the platform depends on the local mock session
 * (`SessionService` → `localStorage`), which does not exist during prerender. The
 * component therefore stays INERT while rendering: it performs no write on render, and
 * its login handler fires on click only. Its per-role links are plain anchors to the
 * prerendered `/previa/:role` pages, so role navigation still works with JavaScript
 * disabled. It never registers and never adds an account.
 */
@Component({
  selector: 'app-preview-role-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preview-role-switcher.component.html'
})
export class PreviewRoleSwitcherComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** The 6 seeded demo accounts; the password is carried for `login` and never bound. */
  protected readonly accounts: readonly SwitcherAccount[] = DEMO_ACCOUNTS.map(
    ({ userId, email, password, role }) => ({ userId, email, password, role })
  );

  /** The prerendered role views, in the shared preview order. */
  protected readonly roles: readonly PreviewRole[] = PREVIEW_ROLES;

  /** es-AR label for a role, used for the account rows and the role anchors (shared with the page). */
  protected readonly roleLabel = previewRoleLabel;

  /** Enters the live platform as the chosen demo account (login + navigate, never register). */
  protected async enter(account: SwitcherAccount): Promise<void> {
    await this.session.login(account.email, account.password);
    await this.router.navigateByUrl('/plataforma/inicio');
  }
}
