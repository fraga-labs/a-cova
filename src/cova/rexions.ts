// ── INICIO: as rexións ──
// As constantes das rexións viven aparte de `mente-semente.ts` porque as
// precisan tanto a semente como `colocacion.ts`, e se se importasen unha
// á outra faríase un ciclo.

/** Ids das cinco rexións da mente. */
export const REXIONS = {
  corpo: 'corpo',
  linguaxe: 'linguaxe',
  afectos: 'afectos',
  conceptos: 'conceptos',
  memorias: 'memorias',
  // A SOMBRA non ten nodos na semente e o seu grupo tampouco se declara
  // aquí: nace coa primeira leccion da ausencia (ver sombras.ts). Un bebe
  // ben coidado nunca chega a ver esta rexion.
  sombra: 'sombra',
  // Igual cá SOMBRA: a rexión dos SONS nace co primeiro son que oe, non
  // na semente. Ao nacer, o bebé aínda non oíu ningún.
  sons: 'sons',
} as const

export type RexionId = (typeof REXIONS)[keyof typeof REXIONS]

export const COR_REXION: Record<RexionId, string> = {
  corpo: '#e08a3c',
  linguaxe: '#a97ae0',
  afectos: '#e07aa8',
  conceptos: '#6fbf73',
  memorias: '#5aa9e0',
  sombra: '#8a8f9c',
  sons: '#c8a15a',
}

export const ETIQUETA_REXION: Record<RexionId, string> = {
  corpo: 'CORPO',
  linguaxe: 'LINGUAXE',
  afectos: 'AFECTOS',
  conceptos: 'CONCEPTOS',
  memorias: 'MEMORIAS',
  sombra: 'SOMBRA',
  sons: 'SONS',
}

/**
 * Tag que marca un nodo como AUTÓNOMO: a política de crecemento
 * desbloquéao (e volve bloquealo) soa en canto o seu prerequisito
 * pasa a estar satisfeito (ou deixa de estalo).
 *
 * O motor NON fai isto por si: `TreeEngine` nunca move un nodo de
 * `locked` a `unlockable`/`unlocked` sen que alguén chame `unlock()`.
 * Ver docs/ACHADOS.md (achado 1).
 */
export const TAG_AUTO = 'auto'

/** Prefixos de id por familia de nodo nacido en runtime. */
export const PREFIXO = {
  palabra: 'palabra:',
  concepto: 'concepto:',
  memoria: 'memoria:',
} as const

// ── FIN: as rexións ──
