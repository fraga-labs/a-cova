// ── INICIO: exportar bebé ──
// «Exportar o bebé = un documento Yggdrasil. Ábrese no editor.
//  Same document, same decisions — agora tamén: same mind.»
//
// O que se descarga é un TreeDef pelado (o editor público acéptao tal
// cal, e `ygg validate` tamén). O estado da crianza vai en
// `metadata.aCova`: o motor ignórao, o editor conérvao, e nós podemos
// volvelo cargar sen perder nada.

import type { TreeDef, TreeState } from '@yggdrasil-forge/core'
import type { Acontecemento, EstadoPolitica } from './politica.js'

export const EDITOR_URL = 'https://fraga-labs.github.io/yggdrasil-forge/app/'

export interface CarteiraBebe {
  readonly nome: string
  readonly tree: TreeDef
  readonly state: TreeState
  readonly politica: EstadoPolitica
  readonly acontecementos: readonly Acontecemento[]
}

/** Constrúe o documento exportable. Puro: testable sen navegador. */
export function documentoBebe(b: CarteiraBebe): TreeDef {
  return {
    ...b.tree,
    label: { gl: `A mente de ${b.nome}`, es: `La mente de ${b.nome}`, en: `${b.nome} mind` },
    description: {
      gl: `Criado na Cova ata o día ${b.politica.dia}. Só contén o que se lle ensinou.`,
    },
    metadata: {
      ...b.tree.metadata,
      aCova: {
        formato: 1,
        nome: b.nome,
        dia: b.politica.dia,
        exportadoEn: new Date().toISOString(),
        drives: b.state.budget.resources,
        politica: b.politica,
        acontecementos: b.acontecementos.slice(-200),
        aviso:
          'A semántica deste bebé non ten grounding: «auga» é un nodo conectado a estímulos, non auga.',
      },
    },
  }
}

export function nomeFicheiro(b: CarteiraBebe): string {
  const limpo = b.nome.toLocaleLowerCase('gl').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `a-cova-${limpo === '' ? 'bebe' : limpo}-dia-${b.politica.dia}.json`
}

/** Dispara a descarga no navegador. */
export function descargarBebe(b: CarteiraBebe): void {
  const texto = JSON.stringify(documentoBebe(b), null, 2)
  const blob = new Blob([texto], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFicheiro(b)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
// ── FIN: exportar bebé ──
