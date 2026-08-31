// ── INICIO: sen til ──
// Quitar acentos SEN tocar o «ñ».
//
// O truco habitual (`normalize('NFD')` + borrar diacríticos) non vale en
// galego: descompón o «ñ» en «n» + til e déixao en «n». Pero o «ñ» non é
// un «n» con adorno, é outro son — e «niño» e «nino» non son a mesma
// palabra. Como a lista de vogais acentuadas é curta e pechada,
// escribímola e acabouse.

const SEN_TIL: Readonly<Record<string, string>> = {
  á: 'a',
  à: 'a',
  â: 'a',
  ä: 'a',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  í: 'i',
  ì: 'i',
  î: 'i',
  ï: 'i',
  ó: 'o',
  ò: 'o',
  ô: 'o',
  ö: 'o',
  ú: 'u',
  ù: 'u',
  û: 'u',
  ü: 'u',
  ç: 'z',
}

/** Minúsculas e sen acentos, pero co «ñ» intacto. */
export function senTil(texto: string): string {
  return [...texto.toLocaleLowerCase('gl')].map((c) => SEN_TIL[c] ?? c).join('')
}
// ── FIN: sen til ──
