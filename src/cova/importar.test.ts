// ── INICIO: probas de importar bebé ──
// A proba que vale é a de IDA E VOLTA: exportar un bebé criado e volvelo
// meter sen perder nada. O resto son só as formas de dicir que non.

import { TreeEngine } from '@yggdrasil-forge/core'
import { describe, expect, it } from 'vitest'
import { documentoBebe } from './exportar.js'
import { lerBebe } from './importar.js'
import { type Familiaridade, type Referentes, ensinarPalabra, idPalabra } from './linguaxe.js'
import { menteSemente } from './mente-semente.js'
import { ESTADO_INICIAL, type EstadoPolitica } from './politica.js'

/** Copia crúa do documento e mailo seu `metadata.aCova`, para tocalo. */
function crear(doc: unknown): {
  readonly cru: Record<string, unknown>
  readonly meta: Record<string, unknown>
} {
  const cru = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>
  const metadata = cru.metadata as Record<string, unknown>
  return { cru, meta: metadata.aCova as Record<string, unknown> }
}

/** Un bebé que xa di unha palabra ben, para ter algo que perder. */
async function criar(): Promise<{ engine: TreeEngine; politica: EstadoPolitica }> {
  const engine = new TreeEngine(menteSemente(), {})
  let familiaridade: Familiaridade = {}
  let referentes: Referentes = {}
  let ditas: readonly string[] = []
  for (let i = 0; i < 20; i += 1) {
    const r = await ensinarPalabra(
      engine,
      { referente: 'auga', forza: 100 },
      familiaridade,
      referentes,
      ditas,
      'auga',
      i,
    )
    familiaridade = r?.familiaridade ?? familiaridade
    referentes = r?.referentes ?? referentes
    ditas = r?.ditas ?? ditas
  }
  return {
    engine,
    politica: { ...ESTADO_INICIAL, dia: 4, familiaridade, referentes, ditas },
  }
}

describe('ida e volta', () => {
  it('o bebé que se exporta é o bebé que volve', async () => {
    const { engine, politica } = await criar()
    expect(engine.getNodeState(idPalabra('auga'))?.currentTier).toBe(3)

    const doc = documentoBebe({
      nome: 'Meco',
      tree: engine.getTreeDef(),
      state: engine.getSnapshot(),
      politica,
      acontecementos: [],
    })
    const r = lerBebe(JSON.stringify(doc))
    if (!r.ok) {
      throw new Error(`non importou: ${r.erro}`)
    }

    expect(r.bebe.nome).toBe('Meco')
    expect(r.bebe.politica.dia).toBe(4)
    expect(r.bebe.politica.ditas).toEqual(['auga'])
    expect(r.bebe.tree.nodes.some((n) => n.id === idPalabra('auga'))).toBe(true)

    // E o que de verdade se perdía antes: a crianza. Un motor levantado
    // co que volveu ten a palabra no mesmo rango, non a cero.
    const revivido = new TreeEngine(r.bebe.tree, { initialState: r.bebe.state })
    expect(revivido.getNodeState(idPalabra('auga'))?.currentTier).toBe(3)
  })

  it('un campo que non existía nun ficheiro vello non rompe nada', () => {
    const doc = documentoBebe({
      nome: 'Meco',
      tree: menteSemente(),
      state: new TreeEngine(menteSemente(), {}).getSnapshot(),
      politica: ESTADO_INICIAL,
      acontecementos: [],
    })
    // Un ficheiro escrito antes de que existisen `recentes`/`referentes`.
    const { cru, meta } = crear(doc)
    meta.politica = { dia: 9, momentos: 3 }

    const r = lerBebe(JSON.stringify(cru))
    if (!r.ok) {
      throw new Error(r.erro)
    }
    expect(r.bebe.politica.dia).toBe(9)
    expect(r.bebe.politica.recentes).toEqual([])
    expect(r.bebe.politica.referentes).toEqual({})
  })
})

describe('as formas de dicir que non', () => {
  it('un ficheiro que non é JSON', () => {
    expect(lerBebe('isto non é json')).toEqual({ ok: false, erro: 'Iso non é un ficheiro JSON.' })
  })

  it('un JSON que non é un documento Yggdrasil', () => {
    const r = lerBebe('{"algo": 1}')
    expect(r.ok).toBe(false)
  })

  it('un documento Yggdrasil que non é un bebé', () => {
    // A mente semente pelada É válida, pero non ten crianza ningunha.
    const r = lerBebe(JSON.stringify(menteSemente()))
    expect(r).toEqual({
      ok: false,
      erro: 'É un documento Yggdrasil, pero non un bebé da Cova.',
    })
  })

  it('un bebé exportado antes de que se gardase o estado', () => {
    const doc = documentoBebe({
      nome: 'Meco',
      tree: menteSemente(),
      state: new TreeEngine(menteSemente(), {}).getSnapshot(),
      politica: ESTADO_INICIAL,
      acontecementos: [],
    })
    const { cru, meta } = crear(doc)
    meta.formato = 1
    meta.estado = undefined

    const r = lerBebe(JSON.stringify(cru))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.erro).toContain('versión anterior')
    }
  })
})
// ── FIN: probas de importar bebé ──
