// ── INICIO: probas do balbucido ──
// Do módulo de son só se pode probar sen navegador a parte que é pura —
// pero é xustamente a que importa que sexa correcta: que a voz do bebé
// sexa SEMPRE A MESMA para a mesma palabra. Se «auga» soase distinto
// cada vez, non parecería a súa voz, parecería ruído.

import { describe, expect, it } from 'vitest'
import { balbucido } from './son.js'

describe('o balbucido', () => {
  it('é determinista: a mesma palabra soa igual sempre', () => {
    expect(balbucido('auga')).toEqual(balbucido('auga'))
    expect(balbucido('auga')).toEqual(balbucido('AUGA'))
  })

  it('dálle unha nota a cada letra', () => {
    expect(balbucido('auga')).toHaveLength(4)
    expect(balbucido('mama')).toHaveLength(4)
  })

  it('palabras distintas soan distinto', () => {
    expect(balbucido('auga')).not.toEqual(balbucido('leite'))
  })

  it('non se alonga sen fin: seis notas como moito', () => {
    expect(balbucido('extraordinariamente').length).toBeLessThanOrEqual(6)
  })

  it('sempre devolve algo que soe, mesmo con lixo', () => {
    expect(balbucido('...').length).toBeGreaterThan(0)
    expect(balbucido('').length).toBeGreaterThan(0)
  })

  it('todas as notas están na escala: soe o que soe, non desafina', () => {
    const escala = new Set([523, 587, 659, 784, 880, 1046])
    for (const palabra of ['auga', 'mama', 'papa', 'leite', 'durmir', 'ñam']) {
      for (const nota of balbucido(palabra)) {
        expect(escala.has(nota)).toBe(true)
      }
    }
  })
})
// ── FIN: probas do balbucido ──
