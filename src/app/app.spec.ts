import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

const shellOrder = (element: HTMLElement): string[] =>
  Array.from(element.children).map((child) => child.tagName.toLowerCase());

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render a router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
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
});
