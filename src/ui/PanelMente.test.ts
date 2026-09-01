// ── INICIO: probas do encadre ──
// Só a decisión, que é a parte que se pode equivocar. O `fit()` e o
// `centerOn()` son do motor e xa teñen as súas probas; o que é noso é
// «cando paga a pena achegarse e cando non».

import { describe, expect, it } from 'vitest'
import { zoomLexible } from './PanelMente.js'

// Escala = píxeles de pantalla por unidade de layout. Estes dous
// números están MEDIDOS na aplicación, non inventados.
const TELEFONO = 5 / 15 // lenzo de 331 px, mente pequena: fonte a 5 px
const MENTE_GRANDE = 2.7 / 15 // panel de escritorio con 200 palabras

describe('cando paga a pena achegarse ao abrir', () => {
  it('nun panel estreito, un empuxón abonda e dáse', () => {
    // 5 px non se len; con 1,4× chégase aos 7.
    expect(zoomLexible(TELEFONO, 1)).toBeCloseTo(1.4, 5)
  })

  it('se xa se le, non se toca nada', () => {
    // O mesmo teléfono pero co encadre xa a 1,5×: 7,5 px, lexible.
    expect(zoomLexible(TELEFONO, 1.5)).toBeNull()
  })

  it('cunha mente grande NON se achega: perderíase a vista do conxunto', () => {
    // Farían falta 2,6× e o tope está en 2. Iso xa non é un panel
    // estreito, é unha mente grande, e ver a forma do que hai vale máis
    // ca unha lupa sobre o centro.
    expect(zoomLexible(MENTE_GRANDE, 1)).toBeNull()
  })

  it('a mente grande, cando xa está preto, si se le sen tocar nada', () => {
    // A 5× a etiqueta xa vai por 13,5 px. Non hai nada que decidir.
    expect(zoomLexible(MENTE_GRANDE, 5)).toBeNull()
  })

  it('o tope é relativo ao encadre, non absoluto', () => {
    // Fonte a 2 px ao zoom 1: farían falta 3,5×, que é máis do dobre.
    const apertado = 2 / 15
    expect(zoomLexible(apertado, 1)).toBeNull()
    // O mesmo lenzo pero cun encadre que xa quedou en 2×: aínda non se
    // le (4 px), e agora os 3,5× que faltan si están permitidos.
    expect(zoomLexible(apertado, 2)).toBeCloseTo(3.5, 5)
  })
})
// ── FIN: probas do encadre ──
