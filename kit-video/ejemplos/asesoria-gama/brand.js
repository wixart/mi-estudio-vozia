/* Asesoría Gama · estilo de su web asesoriagama.es
   Limpio y minimalista: fondos gris-azulado muy claros, texto pizarra, acento oro rosa en botones-píldora */
window.BRAND = {
  style: 'clean', font: 'Inter',
  fonts: [['Inter', 'Inter-ExtraBold.otf', 800], ['Inter', 'Inter-Bold.otf', 700], ['Inter', 'Inter-SemiBold.otf', 600], ['Inter', 'Inter-Medium.otf', 500]],
  grain: .15, vignette: .06,
  // tokens de color (los nombres se mantienen para que las escenas no cambien)
  green: '#2D3748',      // primario: pizarra (títulos, paneles)
  greenMid: '#4A5568',   // pizarra media
  copper: '#B7826E',     // oro rosa de la web (botones)
  red: '#9C5F4A',        // oro rosa oscuro: sellos, etiquetas, palabras clave
  ink: '#1A202C', cream: '#EDF2F7', paper: '#FFFFFF', sage: '#D9AC9B',
  coin: '#E4B9A3', coinDark: '#B7826E', coinLight: '#F2CDBA',   // monedas en oro rosa
  card: '#FFFFFF', dark: '#1A202C', clip: '#4A5568', track: '#E2E8F0', screen: '#F7FAFC', key: '#CBD5E0',
  cloud: '#FFFFFF', column: '#F2CDBA', handle: '#4A5568', soft: '#F6E4DA', highlight: 'rgba(242,205,186,.9)',
  reqLabel: '#2D3748', leaves: false,
  capText: '#1A202C', capEmph: '#A2654F',
  ctaBtn: '#B7826E',
  stripes: ['#F2CDBA', '#B7826E', '#2D3748'],
  clean: { light: '#F7FAFC', light2: '#EDF2F7', dot: 'rgba(45,55,72,.06)', floor: '#E2E8F0', floor2: '#E2E8F0', floorLine: 'rgba(45,55,72,.06)',
           blush: '#F8EBE4', blushDot: 'rgba(183,130,110,.12)', blushFloor: '#F0D9CD', slate1: '#2D3748', slate2: '#1A202C' },
  bgMap: { board: 'light', cork: 'slate', teal: 'light', wood: 'blushPlain', sage: 'light2', sky: 'blush', brand: 'white', cream: 'lightPlain' },
  ctaLayout: { logoY: 680, logoW: 300, div: 862, b: [945, 1045, 1145], title: 1305, c1: 1450, c2: 1550, foot: 1632 },
  logo: 'logo_web.png', badge: 'header', noBadgeScene: 'cta'
};
