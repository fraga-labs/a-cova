// ── INICIO: o léxico da cova ──
// O bebé non ten grounding: «auga» é un nodo conectado a estímulos, non
// auga. Este ficheiro é exactamente iso, dito sen adornos: unha táboa
// que di que palabras CASAN con que estímulo, e que campos semánticos
// poden dar lugar a un concepto. Nada máis. Está aquí á vista a propósito.

import { senTil } from './sentil.js'

/** Os estímulos que o coidador pode proxectar na cova. */
export type EstimuloId = 'fame' | 'auga' | 'sono' | 'xogo' | 'amor' | 'caca' | 'nada'

export interface Estimulo {
  readonly id: EstimuloId
  /** Que está a pasar, en linguaxe do coidador. */
  readonly descricion: string
  /** Palabras que o bebé pode asociar a este estímulo (normalizadas). */
  readonly palabras: readonly string[]
}

export const ESTIMULOS: Readonly<Record<EstimuloId, Estimulo>> = {
  fame: {
    id: 'fame',
    descricion: 'está a comer',
    palabras: ['papa', 'comer', 'leite', 'biberon', 'fame', 'ñam'],
  },
  auga: {
    id: 'auga',
    descricion: 'está no baño',
    palabras: ['auga', 'baño', 'limpo', 'lavar'],
  },
  sono: {
    id: 'sono',
    descricion: 'está a durmir',
    palabras: ['durmir', 'sono', 'cama', 'noite'],
  },
  xogo: {
    id: 'xogo',
    descricion: 'está a xogar',
    palabras: ['xogar', 'pelota', 'ri', 'boliña'],
  },
  amor: {
    id: 'amor',
    descricion: 'está nos teus brazos',
    palabras: ['mama', 'papa', 'amor', 'bico', 'aloumiño'],
  },
  caca: {
    id: 'caca',
    descricion: 'acaba de facer caca',
    palabras: ['caca', 'sucio', 'puag'],
  },
  nada: {
    id: 'nada',
    descricion: 'non está a nada en particular',
    palabras: [],
  },
}

/**
 * Campos semánticos. Dúas palabras a 3/3 do MESMO campo fan nacer o
 * concepto. É unha regra, non maxia: está escrita aquí e pódese ler.
 */
export interface CampoSemantico {
  readonly id: string
  readonly etiqueta: string
  readonly icona: string
  /** Palabras (normalizadas) que pertencen a este campo. */
  readonly palabras: readonly string[]
}

export const CAMPOS: readonly CampoSemantico[] = [
  {
    id: 'bebida',
    etiqueta: 'bebida',
    icona: '🥛',
    palabras: ['auga', 'leite', 'biberon', 'beber', 'papa'],
  },
  {
    id: 'familia',
    etiqueta: 'familia',
    icona: '👪',
    palabras: ['mama', 'papa', 'avoa', 'avo', 'bico', 'amor'],
  },
  {
    id: 'limpeza',
    etiqueta: 'limpeza',
    icona: '🫧',
    palabras: ['auga', 'baño', 'limpo', 'lavar', 'sucio', 'caca'],
  },
  {
    id: 'descanso',
    etiqueta: 'descanso',
    icona: '🌙',
    palabras: ['durmir', 'sono', 'cama', 'noite'],
  },
  {
    id: 'xogo',
    etiqueta: 'xogo',
    icona: '🎈',
    palabras: ['xogar', 'pelota', 'ri', 'boliña'],
  },
]

/**
 * Normaliza unha palabra do coidador: minúsculas, sen espazos de sobra
 * e sen acentos. Sen acentos a propósito — o coidador escribe rápido e
 * «mamá» e «mama» son a mesma palabra para o bebé. O «ñ» SI se
 * conserva: non é un «n» con adorno (ver `sentil.ts`).
 */
export function normalizar(palabra: string): string {
  return senTil(palabra.trim())
}

/** `true` se a palabra casa co estímulo activo (repetición EN CONTEXTO). */
export function casaConEstimulo(palabra: string, estimulo: EstimuloId): boolean {
  return ESTIMULOS[estimulo].palabras.includes(normalizar(palabra))
}

/** Campos semánticos aos que pertence unha palabra. */
export function camposDe(palabra: string): readonly CampoSemantico[] {
  const p = normalizar(palabra)
  return CAMPOS.filter((c) => c.palabras.includes(p))
}
// ── FIN: o léxico da cova ──
