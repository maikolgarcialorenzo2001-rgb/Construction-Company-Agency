import { describe, expect, it } from 'vitest';

import {
  LEAD_GREETING,
  LEAD_PHOTO_INVITE,
  buildLeadMessage,
  buildMailtoUrl,
  buildTelHref,
  buildWhatsAppUrl,
  toWaDigits,
  type LeadFields
} from './lead-links';

const MINIMAL_FIELDS: LeadFields = {
  workTypeLabel: 'Reforma',
  location: 'Belgrano',
  areaM2: 45
};

const FULL_FIELDS: LeadFields = {
  workTypeLabel: 'Reforma integral',
  location: 'Villa Crespo',
  areaM2: 120,
  budgetLabel: 'Entre 3 y 8 millones',
  stageLabel: 'Planificando',
  comment: 'Prioridad con la cocina.'
};

const MULTILINE_COMMENT = 'Prioridad con la cocina.\nHay que revisar la instalación eléctrica.';

const MULTILINE_FIELDS: LeadFields = { ...MINIMAL_FIELDS, comment: MULTILINE_COMMENT };

describe('toWaDigits', () => {
  it('strips the display formatting from a phone', () => {
    expect(toWaDigits('+54 9 11 2345-6789')).toBe('5491123456789');
  });

  it('leaves an already bare number untouched', () => {
    expect(toWaDigits('5491100000000')).toBe('5491100000000');
  });

  it('never leaves a plus sign in the digits', () => {
    expect(toWaDigits('+5491100000000')).not.toContain('+');
  });

  it('returns an empty string when there is no digit at all', () => {
    expect(toWaDigits('sin numeros')).toBe('');
  });
});

describe('buildLeadMessage', () => {
  it('keeps the documented line order for a complete submission', () => {
    expect(buildLeadMessage(FULL_FIELDS).split('\n')).toEqual([
      LEAD_GREETING,
      'Tipo de trabajo: Reforma integral',
      'Ubicación: Villa Crespo',
      'Superficie (m²): 120',
      'Presupuesto estimado: Entre 3 y 8 millones',
      'Etapa: Planificando',
      'Comentario: Prioridad con la cocina.',
      LEAD_PHOTO_INVITE
    ]);
  });

  it('preserves the line breaks of a multi-line comment', () => {
    expect(buildLeadMessage(MULTILINE_FIELDS)).toContain(
      'Comentario: Prioridad con la cocina.\nHay que revisar la instalación eléctrica.'
    );
  });

  it('omits every optional line the visitor left empty', () => {
    const message = buildLeadMessage(MINIMAL_FIELDS);

    expect(message).not.toContain('Presupuesto estimado');
    expect(message).not.toContain('Etapa:');
    expect(message).not.toContain('Comentario:');
    expect(message.split('\n')).toHaveLength(5);
  });

  it('omits an optional line that holds only whitespace', () => {
    expect(buildLeadMessage({ ...MINIMAL_FIELDS, budgetLabel: '   ' })).not.toContain(
      'Presupuesto estimado'
    );
  });

  it('ends with the exact photo invitation', () => {
    const message = buildLeadMessage(MINIMAL_FIELDS);

    expect(message.endsWith(LEAD_PHOTO_INVITE)).toBe(true);
    expect(message.split('\n').at(-1)).toBe(LEAD_PHOTO_INVITE);
  });

  it('keeps a zero area instead of dropping the line', () => {
    expect(buildLeadMessage({ ...MINIMAL_FIELDS, areaM2: 0 })).toContain('Superficie (m²): 0');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me deep link carrying the message', () => {
    expect(buildWhatsAppUrl('5491100000000', 'Hola')).toBe('https://wa.me/5491100000000?text=Hola');
  });

  it('produces a valid URL', () => {
    const url = new URL(buildWhatsAppUrl('5491100000000', MULTILINE_COMMENT));

    expect(url.origin + url.pathname).toBe('https://wa.me/5491100000000');
    expect(url.searchParams.get('text')).toBe(MULTILINE_COMMENT);
  });

  it('encodes characters that would break the query string', () => {
    const url = buildWhatsAppUrl('5491100000000', 'a & b? c#d');

    expect(url).not.toContain('& b');
    expect(url).not.toContain('? c');
    expect(url).not.toContain('#d');
    expect(new URL(url).searchParams.get('text')).toBe('a & b? c#d');
  });

  it('encodes spaces, newlines and accents', () => {
    const url = buildWhatsAppUrl('5491100000000', MULTILINE_COMMENT);

    expect(url).not.toContain(' ');
    expect(url).not.toContain('\n');
    expect(url).not.toContain('ó');
    expect(new URL(url).searchParams.get('text')).toBe(MULTILINE_COMMENT);
  });

  it('never puts a plus sign in the number segment', () => {
    const url = buildWhatsAppUrl(toWaDigits('+54 9 11 0000-0000'), 'Hola');

    expect(url).toBe('https://wa.me/5491100000000?text=Hola');
  });
});

describe('buildMailtoUrl', () => {
  it('carries the subject and the body', () => {
    const message = buildLeadMessage(MINIMAL_FIELDS);
    const url = buildMailtoUrl('contacto@empresa.com', 'Presupuesto web', message);
    const parsed = new URL(url);

    expect(url.startsWith('mailto:contacto@empresa.com?')).toBe(true);
    expect(parsed.searchParams.get('subject')).toBe('Presupuesto web');
    expect(parsed.searchParams.get('body')).toBe(message);
  });

  it('keeps the same body text as the WhatsApp message', () => {
    const message = buildLeadMessage(FULL_FIELDS);

    expect(new URL(buildMailtoUrl('a@b.com', 's', message)).searchParams.get('body')).toBe(message);
  });
});

describe('buildTelHref', () => {
  it('adds exactly one plus sign to the digits', () => {
    expect(buildTelHref('5491100000000')).toBe('tel:+5491100000000');
  });

  it('does not double the plus sign of an already formatted number', () => {
    expect(buildTelHref(toWaDigits('+54 9 11 0000-0000'))).toBe('tel:+5491100000000');
  });
});
