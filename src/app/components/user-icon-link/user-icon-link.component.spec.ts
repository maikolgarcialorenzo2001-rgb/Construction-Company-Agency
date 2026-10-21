import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SESSION_STORAGE_KEY, SessionService } from '../../core/platform/auth/session.service';
import { UserIconLinkComponent } from './user-icon-link.component';

/**
 * The shared user icon: a session-aware anchor. The signed-in visitor reaches
 * their own public profile, an anonymous visitor reaches the login (when the
 * host provides that target) and the platform header renders NOTHING when
 * there is no session.
 */
describe('UserIconLinkComponent', () => {
  beforeEach(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  /** Seeds a signed-in session so the component reads a user. */
  const seedSession = (userId: string, role: 'worker' | 'company'): void => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        token: `mock-token-${userId}`,
        user: { userId, email: `${userId}@demo.test`, role }
      })
    );
  };

  const render = async (
    anonymousHref: string | null = null
  ): Promise<ComponentFixture<UserIconLinkComponent>> => {
    const fixture = TestBed.createComponent(UserIconLinkComponent);
    fixture.componentRef.setInput('anonymousHref', anonymousHref);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  it('links a signed-in visitor to their own public profile', async () => {
    seedSession('worker-1', 'worker');

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const anchors = element.querySelectorAll('a');
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute('href')).toBe('/plataforma/perfil/worker-1');
    expect(anchors[0].getAttribute('aria-label')).toBe('Ver mi perfil');
  });

  it('links an anonymous visitor to the login when the host provides that target', async () => {
    const fixture = await render('/plataforma/login');
    const element = fixture.nativeElement as HTMLElement;

    const anchors = element.querySelectorAll('a');
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute('href')).toBe('/plataforma/login');
    expect(anchors[0].getAttribute('aria-label')).toBe('Iniciar sesión');
  });

  it('renders no anchor for an anonymous visitor without a target', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('a').length).toBe(0);
  });

  it('keeps the icon decorative and the accessible name on the anchor', async () => {
    seedSession('worker-1', 'worker');

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const svg = element.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(element.querySelector('a')?.getAttribute('aria-label')).toBe('Ver mi perfil');
  });

  it('switches the target when the session changes, without a reload', async () => {
    const fixture = await render('/plataforma/login');
    const element = fixture.nativeElement as HTMLElement;
    const session = TestBed.inject(SessionService);

    expect(element.querySelector('a')?.getAttribute('href')).toBe('/plataforma/login');

    await session.login('lucia@demo.test', 'demo1234');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('a')?.getAttribute('href')).toBe('/plataforma/perfil/worker-1');

    await session.logout();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('a')?.getAttribute('href')).toBe('/plataforma/login');
  });

  it('never renders an img', async () => {
    seedSession('worker-1', 'worker');

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('img').length).toBe(0);
  });
});
