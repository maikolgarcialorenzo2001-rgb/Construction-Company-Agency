import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';

@Component({ selector: 'app-stub', template: 'stub' })
class Stub {}

const shellOrder = (element: HTMLElement): string[] =>
  Array.from(element.children).map((child) => child.tagName.toLowerCase());

/** Fixture routes: the platform subtree and one marketing route, both stubbed. */
const stubRoutes = [
  {
    path: 'plataforma',
    children: [
      { path: '', component: Stub },
      { path: '**', component: Stub }
    ]
  },
  { path: 'servicios', component: Stub },
  { path: '**', component: Stub }
];

const navigateTo = async (path: string): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  await TestBed.inject(Router).navigateByUrl(path);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(stubRoutes)]
    }).compileComponents();
  });

  it('renders the skip link first so keyboard users reach the content first', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const skipLink = element.querySelector<HTMLAnchorElement>('a.skip-link');

    expect(skipLink).not.toBeNull();
    expect(skipLink?.getAttribute('href')).toBe('#main');
    expect(skipLink?.textContent?.trim()).toBeTruthy();
    expect(shellOrder(element)[0]).toBe('a');
  });

  it('nests the routed page inside <main id="main">, the skip link target', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const main = element.querySelector('main');

    expect(main?.id).toBe('main');
    expect(main?.querySelector('router-outlet')).not.toBeNull();
  });

  it('orders the shell as skip link, header, main, footer, sticky CTA', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(shellOrder(element)).toEqual([
      'a',
      'app-header',
      'main',
      'app-footer',
      'app-sticky-cta'
    ]);
  });

  it('mounts the chrome in the shell, not inside the routed page', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    // One of each, all outside <main>: the routed page owns only its own content.
    expect(element.querySelectorAll('app-header').length).toBe(1);
    expect(element.querySelectorAll('app-footer').length).toBe(1);
    expect(element.querySelectorAll('app-sticky-cta').length).toBe(1);
    expect(element.querySelector('main app-header')).toBeNull();
    expect(element.querySelector('main app-footer')).toBeNull();
  });

  it('renders only the skip link before platform chrome on any /plataforma route', async () => {
    for (const path of ['/plataforma', '/plataforma/trabajos']) {
      const element = await navigateTo(path);

      expect(element.querySelector('app-platform-header'), `${path} platform header`).not.toBeNull();
      expect(element.querySelector('app-header'), `${path} marketing header`).toBeNull();
      expect(element.querySelector('app-footer'), `${path} marketing footer`).toBeNull();
      expect(element.querySelector('app-sticky-cta'), `${path} sticky cta`).toBeNull();
      expect(element.querySelector('main router-outlet'), `${path} main outlet`).not.toBeNull();
    }
  });

  it('keeps the marketing shell on marketing routes', async () => {
    const element = await navigateTo('/servicios');

    expect(element.querySelector('app-platform-header')).toBeNull();
    expect(element.querySelector('app-header')).not.toBeNull();
    expect(element.querySelector('app-footer')).not.toBeNull();
    expect(element.querySelector('app-sticky-cta')).not.toBeNull();
  });

  it('switches chrome back when the user leaves the platform subtree', async () => {
    const platform = await navigateTo('/plataforma');
    expect(platform.querySelector('app-platform-header')).not.toBeNull();

    const marketing = await navigateTo('/servicios');
    expect(marketing.querySelector('app-platform-header')).toBeNull();
    expect(marketing.querySelector('app-header')).not.toBeNull();
    expect(marketing.querySelector('app-sticky-cta')).not.toBeNull();
  });
});
