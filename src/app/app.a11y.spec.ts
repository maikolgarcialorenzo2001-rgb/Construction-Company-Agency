import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import * as axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './app';
import { routes } from './app.routes';

/**
 * seo-analytics-performance Req 7 (the automated half): every rendered route is scanned
 * with axe-core on the rules that DOM-only analysis can answer under jsdom.
 *
 * Two WCAG AA checks CANNOT be answered here and stay on the README manual gate:
 * focus visibility (2.4.7, a paint-time property with no DOM-only axe rule) and body
 * text contrast (1.4.3, needs layout + canvas, which jsdom never computes). They are
 * simply not part of this run — nothing is disabled after a failing scan.
 */
const TARGET_PATHS = [
  '/',
  '/servicios',
  '/servicios/reformas-integrales',
  '/proyectos',
  '/proyectos/casa-timber-pilar',
  '/proceso',
  '/testimonios',
  '/nosotros',
  '/presupuesto',
  '/pagina-que-no-existe'
] as const;

const AXE_RULES = [
  'image-alt',
  'button-name',
  'link-name',
  'label',
  'nested-interactive',
  'landmark-one-main',
  'page-has-heading-one',
  'region',
  'list',
  'duplicate-id'
];

const AXE_OPTIONS: Partial<axe.RunOptions> = {
  runOnly: { type: 'rule', values: AXE_RULES }
};

/**
 * jsdom has no `IntersectionObserver`, so the deferred photo gallery would throw on
 * mount. The same stub used by the page specs keeps the gallery on its placeholder
 * (offset `aria-hidden`) — which is exactly what a scanner wants to audit anyway.
 */
class IntersectionObserverStub {
  observe(): void {
    return;
  }
  unobserve(): void {
    return;
  }
  disconnect(): void {
    return;
  }
  takeRecords(): Partial<IntersectionObserverEntry>[] {
    return [];
  }
}

describe('accessibility scan (axe-core)', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes, withComponentInputBinding())]
    });

    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    router = TestBed.inject(Router);

    // axe needs the scanned node inside the document to resolve references.
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  /** Navigates the real shell (chrome + routed page) and flushes the render pass. */
  const goto = async (path: string): Promise<HTMLElement> => {
    await router.navigateByUrl(path);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('renders every route with zero axe violations on the jsdom-capable rules', async () => {
    const summary: string[] = [];

    for (const path of TARGET_PATHS) {
      await goto(path);

      // Scan the document, not the fixture root: landmark rules are document-scoped and
      // axe.run(subtree) silently marks them inapplicable, which would hide regressions.
      const results = await axe.run(document, AXE_OPTIONS);
      const issues = results.violations.map((violation) => {
        const targets = violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(', ');
        return `${violation.id} (${violation.nodes.length}) ${violation.help} @ ${targets}`;
      });

      summary.push(`${path} — ${issues.length} issues`);
      expect(issues, `${path} axe violations`).toEqual([]);

      // A rule that never ran is a blind spot, not a pass: every enabled rule must land
      // in exactly one result bucket (pass, violation, incomplete or inapplicable).
      const evaluated = new Set([
        ...results.passes.map((rule) => rule.id),
        ...results.violations.map((rule) => rule.id),
        ...results.incomplete.map((rule) => rule.id),
        ...results.inapplicable.map((rule) => rule.id)
      ]);
      for (const rule of AXE_RULES) {
        expect(evaluated.has(rule), `${path} rule ${rule} must have run`).toBe(true);
      }
    }

    // Release gate, not a build gate: the same rules keep running on every route.
    console.info(`[a11y] axe-core scan, ${AXE_RULES.length} rules, ${TARGET_PATHS.length} routes:\n${summary.join('\n')}`);
  }, 30000);

  it('keeps focus order in reading order: no explicit positive tabindex on any route', async () => {
    // axe has no DOM-only rule for WCAG 2.4.3. In a template where the DOM is written in
    // reading order, the one thing that CAN break tab order is an explicit positive
    // `tabindex` pulling an element out of sequence. `main` and the honeypot use `-1`
    // (intentionally unfocusable steps), which this check deliberately allows.
    for (const path of TARGET_PATHS) {
      await goto(path);
      const reordered = Array.from(document.querySelectorAll('[tabindex]')).filter((node) => {
        const value = node.getAttribute('tabindex');
        return value !== null && Number.parseInt(value, 10) > 0;
      });

      expect(reordered, `${path} elements with a positive tabindex`).toEqual([]);
    }
  });
});