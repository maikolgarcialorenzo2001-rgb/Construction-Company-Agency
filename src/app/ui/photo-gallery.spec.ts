import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ProjectPhoto } from '../../content/content.types';
import { PhotoGallery } from './photo-gallery';

const photo = (index: number, kind: ProjectPhoto['kind']): ProjectPhoto => ({
  kind,
  ...(kind === 'before' ? { caption: `Estado antes ${index}` } : {}),
  image: {
    src: `https://images.example.com/proyectos/demo/foto-${index}.webp`,
    alt: `Foto ${index} del proyecto`,
    width: 1600,
    height: 1067
  }
});

const photos: readonly ProjectPhoto[] = [
  photo(1, 'after'),
  photo(2, 'before'),
  photo(3, 'gallery'),
  photo(4, 'after')
];

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
const observers: { callback: ObserverCallback; targets: Element[] }[] = [];

/**
 * Lets each test decide WHEN the deferred block enters the viewport.
 * The stub keeps the observed elements because Angular only reacts to an entry whose
 * `target` is the very element it asked to observe.
 */
class IntersectionObserverStub {
  private readonly registration: { callback: ObserverCallback; targets: Element[] };

  constructor(callback: ObserverCallback) {
    this.registration = { callback, targets: [] };
    observers.push(this.registration);
  }
  observe(target: Element): void {
    this.registration.targets.push(target);
  }
  unobserve(target: Element): void {
    this.registration.targets = this.registration.targets.filter((seen) => seen !== target);
  }
  disconnect(): void {
    this.registration.targets = [];
  }
  takeRecords(): Partial<IntersectionObserverEntry>[] {
    return [];
  }
}

const scrollIntoView = (): void => {
  for (const { callback, targets } of observers) {
    for (const target of targets) {
      callback([{ isIntersecting: true, target }]);
    }
  }
};

const render = async (
  items: readonly ProjectPhoto[] = photos
): Promise<ComponentFixture<PhotoGallery>> => {
  observers.length = 0;
  const fixture: ComponentFixture<PhotoGallery> = TestBed.createComponent(PhotoGallery);
  fixture.componentRef.setInput('photos', items);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
};

describe('PhotoGallery', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    TestBed.configureTestingModule({ imports: [PhotoGallery] });
  });

  it('holds the images back until the gallery is about to be seen', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('img').length).toBe(0);
  });

  it('reserves the aspect ratio of the pending gallery, so the page does not jump', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="photo-gallery-placeholder"]')).not.toBeNull();
  });

  it('renders one lazy image per photo once the gallery enters the viewport', async () => {
    const fixture = await render();
    scrollIntoView();
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const images = element.querySelectorAll('img');

    expect(images.length).toBe(photos.length);
    for (const image of images) {
      expect(image.getAttribute('loading')).toBe('lazy');
      // `NgOptimizedImage` always writes `fetchpriority`; only a priority image gets "high".
      expect(image.getAttribute('fetchpriority')).not.toBe('high');
    }
  });

  it('drops the placeholder once the images take its place', async () => {
    const fixture = await render();
    scrollIntoView();
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="photo-gallery-placeholder"]')).toBeNull();
  });

  it('labels the evidence so the reader knows what each picture shows', async () => {
    const fixture = await render();
    scrollIntoView();
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('figcaption')?.textContent).toContain('Estado antes 2');
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('Foto 1 del proyecto');
  });
});
