import type { Site } from './content.types';

/**
 * The site payload: NAP, hours, credentials, warranty, story, served areas, Google
 * Business Profile, images and navigation. This module is the ONLY eager content
 * module (the shell, SEO and analytics all need it); every other collection is
 * imported by a lazy page.
 *
 * ⚠️ PLACEHOLDER DATA. The NAP is flagged with `isPlaceholder: true` and the
 * credentials, warranty copy, story and Google Business Profile URL below are equally
 * fictional. Replace all of it before launch: `grep -rn "isPlaceholder" src/`.
 */
export const site = {
  nap: {
    name: 'Constructora Ejemplo',
    streetAddress: 'Av. Ejemplo 1234',
    locality: 'Ciudad Autónoma de Buenos Aires',
    region: 'Buenos Aires',
    postalCode: 'C1414',
    country: 'AR',
    phoneDisplay: '+54 9 11 0000-0000',
    phoneE164: '5491100000000',
    email: 'contacto@constructora-ejemplo.com.ar',
    isPlaceholder: true
  },
  hours: [
    { days: 'Lunes a viernes', opens: '08:00', closes: '18:00' },
    { days: 'Sábados', opens: '08:00', closes: '13:00' }
  ],
  credentials: {
    art: 'Registro Público de Constructores N.º 12345',
    insurance: 'Póliza de responsabilidad civil N.º 4567890',
    professionalRegistration: 'Matrícula Professional N.º 1234',
    cuit: '30-12345678-9'
  },
  warranty:
    'Garantía de diez años en obra gruesa y de dos años en terminaciones, con atención de garantías por escrito.',
  story:
    'Somos una constructora que trabaja hace más de quince años en reformas, obra nueva y ampliaciones en CABA y en el Gran Buenos Aires. Cerramos presupuestos desglosados por partida, fijamos plazos por escrito y dejamos un único responsable de obra para que siempre sepas con quién hablar.',
  areasServed: [
    { slug: 'caba', name: 'Ciudad Autónoma de Buenos Aires' },
    { slug: 'zona-norte', name: 'Zona Norte (Vicente López, San Isidro)' },
    { slug: 'zona-oeste', name: 'Zona Oeste (Morón, Castelar)' },
    { slug: 'zona-sur', name: 'Zona Sur (Avellaneda, Quilmes)' }
  ],
  // Placeholder until the client's public profile exists (reserved domain: never resolves).
  googleBusinessProfileUrl: 'https://example.com/constructora-ejemplo',
  logo: {
    src: 'https://images.example.com/logo.webp',
    alt: 'Logotipo de Constructora Ejemplo',
    width: 512,
    height: 512
  },
  ogImage: {
    src: 'https://images.example.com/og-cover.webp',
    alt: 'Obra de construcción terminada de Constructora Ejemplo',
    width: 1200,
    height: 630
  },
  // Section order is the display order. The quote route is a conversion action, not a section.
  nav: [
    { slug: 'servicios', label: 'Servicios', path: '/servicios' },
    { slug: 'proyectos', label: 'Proyectos', path: '/proyectos' },
    { slug: 'proceso', label: 'Cómo trabajamos', path: '/proceso' },
    { slug: 'testimonios', label: 'Testimonios', path: '/testimonios' },
    { slug: 'nosotros', label: 'Nosotros', path: '/nosotros' }
  ]
} as const satisfies Site;
