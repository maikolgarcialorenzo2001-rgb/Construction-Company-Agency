import { TestBed } from '@angular/core/testing';

import { SectionHeadingComponent } from './section-heading.component';

const render = async (inputs: Record<string, unknown>): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(SectionHeadingComponent);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('SectionHeadingComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SectionHeadingComponent] });
  });

  it('renders the title as the only section heading level', async () => {
    const element = await render({ title: 'Servicios' });

    expect(element.querySelectorAll('h2').length).toBe(1);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Servicios');
  });

  it('omits the eyebrow and the lead when they are not provided', async () => {
    const element = await render({ title: 'Proyectos' });

    expect(element.querySelector('p')).toBeNull();
  });

  it('renders the eyebrow and the lead when they are provided', async () => {
    const element = await render({
      eyebrow: 'Obra terminada',
      title: 'Proyectos',
      lead: 'Fechas, superficie y presupuesto de cada obra.'
    });
    const paragraphs = element.querySelectorAll('p');

    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].textContent?.trim()).toBe('Obra terminada');
    expect(paragraphs[1].textContent?.trim()).toBe(
      'Fechas, superficie y presupuesto de cada obra.'
    );
  });
});
