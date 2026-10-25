import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PostKind, PostView } from '../../core/platform/domain';
import { HomePublicationsComponent } from './home-publications.component';

/** Builds a minimal render-ready post for the component specs. */
const view = (
  id: string,
  kind: PostKind,
  createdAt: string,
  overrides: Partial<PostView> = {}
): PostView => ({
  id,
  kind,
  authorId: 'worker-1',
  authorName: 'Lucía Fernández',
  authorRole: 'worker',
  content: `Contenido de ${id}`,
  attachments: [],
  createdAt,
  ...overrides
});

/** The three shapes the home section promotes, one per kind. */
const PUBLICATIONS: readonly PostView[] = [
  view('post-11', 'job-request', '2026-10-12T10:05:00.000Z', {
    authorId: 'worker-3',
    authorName: 'Sofía Ruiz',
    authorRole: 'worker',
    content: 'Ofrezco servicios de herrería y montaje de estructuras metálicas.'
  }),
  view('post-13', 'vacancy', '2026-10-11T17:30:00.000Z', {
    authorId: 'company-2',
    authorName: 'Grupo Delta Construcciones',
    authorRole: 'company',
    content: 'Abrimos dos búsquedas: plomero para edificio en La Plata y pintor para planta.'
  }),
  view('post-9', 'standard', '2026-10-11T08:50:00.000Z', {
    authorId: 'company-1',
    authorName: 'Constructora Norte SAC',
    authorRole: 'company',
    content: 'Arrancamos el cimado de un multifamiliar en San Isidro.'
  })
];

/**
 * The home publications section (p17 slice 3): a text-only teaser per kind, the
 * author link to the public profile, and a section that owns its own named
 * heading (the shared `SectionHeadingComponent` exposes no `id`).
 */
describe('HomePublicationsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  const render = async (
    publications: readonly PostView[] = PUBLICATIONS
  ): Promise<ComponentFixture<HomePublicationsComponent>> => {
    const fixture = TestBed.createComponent(HomePublicationsComponent);
    fixture.componentRef.setInput('publications', publications);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  it('renders one card per publication', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('[data-testid="home-publication"]').length).toBe(3);
  });

  it('renders the kind badge through the shared post kind labels', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const badges = Array.from(
      element.querySelectorAll('[data-testid="home-publication-kind"]')
    ).map((badge) => badge.textContent?.trim());

    expect(badges).toEqual(['Búsqueda laboral', 'Vacante', 'Publicación']);
  });

  it('shows the author name, the role label and the post text of every teaser', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const cards = element.querySelectorAll('[data-testid="home-publication"]');
    expect(cards[0].textContent).toContain('Sofía Ruiz');
    expect(cards[0].textContent).toContain('Trabajador');
    expect(cards[0].textContent).toContain('Ofrezco servicios de herrería');
    expect(cards[1].textContent).toContain('Grupo Delta Construcciones');
    expect(cards[1].textContent).toContain('Empresa');
    expect(cards[1].textContent).toContain('Abrimos dos búsquedas');
    expect(cards[2].textContent).toContain('Constructora Norte SAC');
    expect(cards[2].textContent).toContain('Arrancamos el cimado');
  });

  it('links every teaser to the author public profile', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const links = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('[data-testid="home-publication-author-link"]')
    );

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/plataforma/perfil/worker-3',
      '/plataforma/perfil/company-2',
      '/plataforma/perfil/company-1'
    ]);
  });

  it('owns its h2 and points the section accessible name at that heading', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const section = element.querySelector('section');
    const heading = section?.querySelector('h2');

    expect(section).not.toBeNull();
    expect(heading?.textContent?.trim()).toBe('Publicaciones');
    expect(heading?.id).toBeTruthy();
    expect(section?.getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(element.querySelectorAll('h2').length).toBe(1);
    expect(element.querySelectorAll('h1').length).toBe(0);
  });

  it('links to the full platform timeline', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const all = element.querySelector<HTMLAnchorElement>('[data-testid="home-publication-see-all"]');
    expect(all?.getAttribute('href')).toBe('/plataforma');
    expect(all?.textContent?.trim()).toBe('Ver todas');
  });

  it('renders no img at all', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('img').length).toBe(0);
  });

  it('rejects a render without the required publications input', () => {
    const fixture = TestBed.createComponent(HomePublicationsComponent);

    expect(() => fixture.detectChanges()).toThrow();
  });
});
