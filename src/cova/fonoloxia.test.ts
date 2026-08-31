// ── INICIO: probas da fonoloxía ──
// Todo isto é puro, así que se pode probar sen motor nin navegador.

import { describe, expect, it } from 'vitest'
import { comoDi, dia, gananciaSon, segmentar } from './fonoloxia.js'

const sons = (...s: readonly string[]): ReadonlySet<string> => new Set(s)

describe('segmentar', () => {
  it('parte a palabra nos seus sons', () => {
    expect(segmentar('auga')).toEqual(['a', 'u', 'g', 'a'])
    expect(segmentar('mama')).toEqual(['m', 'a', 'm', 'a'])
  })

  it('xunta os dígrafos nun só son', () => {
    expect(segmentar('choiva')).toEqual(['ch', 'o', 'i', 'v', 'a'])
    expect(segmentar('carro')).toEqual(['c', 'a', 'rr', 'o'])
    expect(segmentar('galiña')).toEqual(['g', 'a', 'l', 'i', 'ñ', 'a'])
  })

  it('normaliza o que en realidade é outro son', () => {
    expect(segmentar('queixo')).toEqual(['c', 'e', 'i', 'x', 'o'])
    expect(segmentar('guerra')).toEqual(['g', 'e', 'rr', 'a'])
  })

  it('tira o h mudo e a puntuación', () => {
    expect(segmentar('hola!')).toEqual(['o', 'l', 'a'])
    expect(segmentar('  MAMÁ  ')).toEqual(['m', 'a', 'm', 'a'])
  })
})

describe('comoDi — a palabra tal e como lle sae', () => {
  it('sen ningún son, non lle sae nada: iso é balbucido', () => {
    expect(comoDi('auga', sons())).toBe('')
  })

  it('«auga» vai saíndo a medida que gaña sons', () => {
    expect(comoDi('auga', sons('a'))).toBe('aa')
    expect(comoDi('auga', sons('a', 'u'))).toBe('aua')
    expect(comoDi('auga', sons('a', 'u', 'g'))).toBe('auga')
  })

  it('come a consoante final antes ca nada', () => {
    // 'flor' sen 'r': a final cae. E sen 'l', o grupo tamén se reduce.
    expect(comoDi('flor', sons('f', 'o'))).toBe('fo')
    // Con 'l' xa lle sae o grupo, pero a 'r' final segue caendo.
    expect(comoDi('flor', sons('f', 'l', 'o'))).toBe('flo')
  })

  it('o «ñ» non é un «n» con adorno', () => {
    expect(segmentar('niño')).toEqual(['n', 'i', 'ñ', 'o'])
    expect(segmentar('nino')).toEqual(['n', 'i', 'n', 'o'])
  })

  it('substitúe polo son máis doado cando o ten', () => {
    // 'rato': sen 'r' pero con 'l' → 'lato'
    expect(comoDi('rato', sons('l', 'a', 't', 'o'))).toBe('lato')
    // 'sopa': sen 's' pero con 't' → 'topa'
    expect(comoDi('sopa', sons('t', 'o', 'p', 'a'))).toBe('topa')
  })

  it('reduce os grupos de consoantes mentres non os domina', () => {
    // Sen 'r' (nin 'l' para substituílo): 'prato' → 'pato'.
    expect(comoDi('prato', sons('p', 'a', 't', 'o'))).toBe('pato')
  })

  it('cando domina as dúas consoantes, xa di o grupo enteiro', () => {
    expect(comoDi('prato', sons('p', 'r', 'a', 't', 'o'))).toBe('prato')
  })

  it('cando os domina todos, di a palabra tal cal', () => {
    const todos = sons('a', 'u', 'g')
    expect(comoDi('auga', todos)).toBe('auga')
    expect(dia('auga', todos)).toBe(true)
  })

  it('`dia` só é certo se non lle falta ningún son', () => {
    expect(dia('auga', sons('a', 'u'))).toBe(false)
    expect(dia('', sons('a'))).toBe(false)
  })
})

describe('a dificultade', () => {
  it('as vogais son case de balde e a vibrante múltiple é a que máis custa', () => {
    expect(gananciaSon('a')).toBeGreaterThan(gananciaSon('rr'))
    expect(gananciaSon('m')).toBeGreaterThan(gananciaSon('s'))
  })

  it('nunca é cero: todo son acaba por aprenderse', () => {
    for (const s of ['a', 'rr', 'll', 'z', 'ñ', 'x']) {
      expect(gananciaSon(s)).toBeGreaterThan(0)
    }
  })
})
// ── FIN: probas da fonoloxía ──
