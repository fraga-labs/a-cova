// ── INICIO: a fonoloxía ──
// CAPA 0 do deseño da linguaxe (docs/design/LINGUAXE.md).
//
// Primeiro son os sons, non as palabras. O bebé vai facendo inventario
// dos sons que oe, e as súas primeiras palabras están limitadas polos
// que xa domina: o que non domina, substitúeo ou cómeo. Por iso «auga»
// sáelle «aa», despois «aua», e só ao final «auga».
//
// Aquí non hai IPA nin transcrición fonética de verdade: traballamos coas
// letras (cos dígrafos xuntos, iso si). É unha caricatura escollida
// porque dá bo xogo e porque o coidador escribe letras, non fonemas.
//
// Todo este ficheiro é PURO. Non toca o motor nin React: por iso se pode
// probar enteiro sen navegador.

import { senTil } from './sentil.js'

/** Dígrafos que contan como UN son. Han de probarse antes cás letras soltas. */
const DIGRAFOS = ['ch', 'll', 'rr', 'qu', 'gu'] as const

/** Normalización dos dígrafos que en realidade son outro son. */
const EQUIVALENCIAS: Readonly<Record<string, string>> = {
  qu: 'c',
  gu: 'g',
  k: 'c',
  j: 'x',
  y: 'i',
  w: 'u',
  h: '', // muda en galego: non é un son
}

export const VOGAIS = new Set(['a', 'e', 'i', 'o', 'u'])

/**
 * Canto custa cada son. Número de exposicións que fan falta para
 * dominalo do todo, máis ou menos. As vogais case de balde; a vibrante
 * múltiple, a que máis — como na vida.
 */
const DIFICULTADE: Readonly<Record<string, number>> = {
  a: 1,
  e: 1,
  o: 1,
  i: 2,
  u: 2,
  m: 2,
  p: 2,
  b: 2,
  n: 2,
  t: 2,
  d: 3,
  c: 3,
  g: 3,
  f: 3,
  l: 3,
  v: 3,
  ñ: 4,
  ch: 4,
  x: 4,
  z: 4,
  s: 5,
  r: 5,
  ll: 5,
  rr: 6,
}

const DIFICULTADE_POR_DEFECTO = 4

/**
 * Por que se substitúe un son que aínda non se domina. Son as
 * simplificacións clásicas da fala infantil: as fricativas van a
 * oclusivas (s → t), as vibrantes a lateral (r → l), as palatais
 * perden a palatalización (ñ → n).
 */
const SUBSTITUCIONS: Readonly<Record<string, string>> = {
  rr: 'l',
  r: 'l',
  ll: 'l',
  ñ: 'n',
  ch: 't',
  x: 't',
  s: 't',
  z: 't',
  f: 'p',
  v: 'b',
  g: 'd',
  c: 't',
  d: 't',
  l: 'n',
}

/** Todos os sons que a política pode chegar a facer nacer como nodo. */
export const INVENTARIO: readonly string[] = Object.keys(DIFICULTADE)

export function esVogal(son: string): boolean {
  return VOGAIS.has(son)
}

export function dificultade(son: string): number {
  return DIFICULTADE[son] ?? DIFICULTADE_POR_DEFECTO
}

/**
 * Parte unha palabra nos seus sons, xuntando os dígrafos e tirando o que
 * non é son (o «h» mudo, a puntuación).
 *
 * @example segmentar('auga')  → ['a','u','g','a']
 * @example segmentar('choiva') → ['ch','o','i','b','a']
 */
export function segmentar(palabra: string): readonly string[] {
  const limpa = senTil(palabra.trim()).replace(/[^a-zñ]/g, '')

  const sons: string[] = []
  let i = 0
  while (i < limpa.length) {
    const par = limpa.slice(i, i + 2)
    if ((DIGRAFOS as readonly string[]).includes(par)) {
      sons.push(EQUIVALENCIAS[par] ?? par)
      i += 2
      continue
    }
    const letra = limpa[i] ?? ''
    const equivalente = EQUIVALENCIAS[letra]
    if (equivalente === '') {
      i += 1
      continue // h muda
    }
    sons.push(equivalente ?? letra)
    i += 1
  }
  return sons.filter((s) => s.length > 0)
}

/**
 * Como lle sae a palabra ao bebé cos sons que domina hoxe.
 *
 * As regras son as tres simplificacións que fai calquera cativo:
 *  1. **Substitución** — o son que non domina cámbiao por un máis doado,
 *     se ese si o domina; se non, cómeo.
 *  2. **Borrado da consoante final** — o máis temperán de todos.
 *  3. **Redución de grupos** — de dúas consoantes seguidas queda a
 *     primeira («prato» → «pato»).
 *
 * Devolve `''` cando aínda non lle sae nada: iso é balbucido, non palabra.
 */
export function comoDi(palabra: string, dominados: ReadonlySet<string>): string {
  const sons = segmentar(palabra)

  // Gárdase se cada peza saíu dun son DOMINADO ou non: a redución de
  // grupos é unha etapa que se pasa, non unha regra para sempre. Se o
  // bebé domina as dúas consoantes, di o grupo enteiro.
  const pezas: { readonly letra: string; readonly dominado: boolean }[] = []

  sons.forEach((son, i) => {
    const derradeiro = i === sons.length - 1
    if (dominados.has(son)) {
      pezas.push({ letra: son, dominado: true })
      return
    }
    // Regra 2: a consoante final cae antes ca nada.
    if (derradeiro && !esVogal(son)) {
      return
    }
    // Regra 1: substituír polo veciño máis doado, se ese si o domina.
    const substituto = SUBSTITUCIONS[son]
    if (substituto !== undefined && dominados.has(substituto)) {
      pezas.push({ letra: substituto, dominado: false })
      return
    }
    // As vogais que aínda non ten, cómeas. Substituílas todas por «a»
    // daba churros coma «aaa»; comelas dá «aa», que é o que soa de verdade.
  })

  // Regra 3: de dúas consoantes seguidas queda a primeira, PERO só
  // mentres algunha das dúas non estea dominada.
  const reducida: string[] = []
  let anterior: { readonly letra: string; readonly dominado: boolean } | undefined
  for (const peza of pezas) {
    const grupo = anterior !== undefined && !esVogal(anterior.letra) && !esVogal(peza.letra)
    if (grupo && !(anterior?.dominado === true && peza.dominado)) {
      continue
    }
    reducida.push(peza.letra)
    anterior = peza
  }

  return reducida.join('')
}

/** `true` se o bebé xa é quen de dicir a palabra tal e como é. */
export function dia(palabra: string, dominados: ReadonlySet<string>): boolean {
  const sons = segmentar(palabra)
  return sons.length > 0 && sons.every((s) => dominados.has(s))
}

/**
 * Canto sobe a familiaridade cun son cada vez que se oe. Os difíciles
 * soben menos, así que precisan máis exposicións.
 */
export function gananciaSon(son: string): number {
  return Math.max(4, Math.round(100 / (dificultade(son) * 3)))
}
// ── FIN: a fonoloxía ──
