// ── INICIO: probas da política ──
// Verificamos o CORAZÓN NOVO, non o motor (o motor xa ten as súas).
// Todo isto corre sen navegador: a política é pura respecto de React.

import { TreeEngine } from '@yggdrasil-forge/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DIXESTION_MS, LIMIAR_SUCIDADE } from './drives.js'
import { type Familiaridade, type Referentes, ensinarPalabra } from './linguaxe.js'
import { menteSemente } from './mente-semente.js'
import {
  limparCaca,
  programarDixestion,
  reconciliarAutonomos,
  xerarConceptos,
} from './politica.js'

function motor(): TreeEngine {
  return new TreeEngine(menteSemente(), { audit: { enabled: true } })
}

/**
 * Estado do nodo tal e como o le a aplicación. `getNodeState` devolve
 * `null` para un nodo que existe na TreeDef pero que aínda non foi
 * tocado nunca: para nós iso é `locked` (ver docs/ACHADOS.md, achado 2).
 */
function estadoDe(e: TreeEngine, id: string): string {
  return e.getNodeState(id)?.state ?? 'locked'
}

describe('a mente semente', () => {
  it('nace válida e con todo apagado agás o que se declara', () => {
    const e = motor()
    const def = e.getTreeDef()
    expect(def.nodes.length).toBeGreaterThan(0)
    for (const n of def.nodes) {
      expect(estadoDe(e, n.id)).toBe('locked')
    }
  })

  it('arranca cos cinco drives no seu valor inicial, e sen soidade', () => {
    const e = motor()
    const b = e.getBudget().resources
    expect(Object.keys(b).sort()).toEqual(
      ['apego', 'curiosidade', 'enerxia', 'fame', 'sucidade', 'soidade'].sort(),
    )
    expect(b.sucidade).toBe(8)
    // A soidade é un recurso do documento, pero non un drive: non ten
    // barra, e ao nacer está a cero. Ninguén o deixou só aínda.
    expect(b.soidade).toBe(0)
  })
})

describe('regra 1 — autonomía', () => {
  it('o malestar acéndese SÓ ao pasar o limiar de sucidade', async () => {
    const e = motor()
    expect(estadoDe(e, 'malestar')).toBe('locked')

    await e.grantResource('sucidade', LIMIAR_SUCIDADE)
    const feitos = await reconciliarAutonomos(e, 1)

    expect(estadoDe(e, 'malestar')).toBe('unlocked')
    expect(feitos.some((f) => f.nodeId === 'malestar')).toBe(true)
  })

  it('non se apaga só no momento seguinte (o pantasma do canUnlock)', async () => {
    const e = motor()
    await e.grantResource('sucidade', LIMIAR_SUCIDADE)
    await reconciliarAutonomos(e, 1)
    await reconciliarAutonomos(e, 2)
    await reconciliarAutonomos(e, 3)
    expect(estadoDe(e, 'malestar')).toBe('unlocked')
  })

  it('apágase cando a sucidade baixa', async () => {
    const e = motor()
    await e.grantResource('sucidade', LIMIAR_SUCIDADE)
    await reconciliarAutonomos(e, 1)
    await e.grantResource('sucidade', -100)
    await reconciliarAutonomos(e, 2)
    expect(estadoDe(e, 'malestar')).toBe('locked')
  })

  it('o malestar cobra o seu prezo en apego (efecto do nodo)', async () => {
    const e = motor()
    const antes = e.getBudget().resources.apego ?? 0
    await e.grantResource('sucidade', LIMIAR_SUCIDADE)
    await reconciliarAutonomos(e, 1)
    expect(e.getBudget().resources.apego).toBe(antes - 8)
  })

  it('a tristura aparece cando o apego cae por baixo do limiar (regra `none`)', async () => {
    const e = motor()
    await e.grantResource('apego', -100)
    await reconciliarAutonomos(e, 1)
    expect(estadoDe(e, 'tristura')).toBe('unlocked')
  })
})

describe('a dixestion - o que entra, sae', () => {
  // Reloxo falso do SISTEMA, e non o `timeNow` do motor, porque a
  // avaliacion de `time_after` nos prerequisitos usa `Date.now()`
  // directamente e ignora o reloxo inxectado (docs/ACHADOS.md, achado 3).
  const T0 = new Date('2026-08-31T10:00:00Z').getTime()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('a caca non chega antes de tempo e chega soa cando toca', async () => {
    const e = motor()

    await programarDixestion(e, Date.now())
    await reconciliarAutonomos(e, Date.now())
    expect(estadoDe(e, 'caca')).toBe('locked')

    vi.setSystemTime(T0 + DIXESTION_MS + 1)
    await reconciliarAutonomos(e, Date.now())
    expect(estadoDe(e, 'caca')).toBe('unlocked')
  })

  it('a caca dispara a sucidade e o malestar ven detras, non de golpe', async () => {
    const e = motor()
    const sucidadeInicial = e.getBudget().resources.sucidade ?? 0

    await programarDixestion(e, Date.now())
    vi.setSystemTime(T0 + DIXESTION_MS + 1)
    await reconciliarAutonomos(e, Date.now())

    expect(e.getBudget().resources.sucidade).toBe(sucidadeInicial + 45)
    // 8 + 45 = 53 < 60: ainda non hai malestar. Un chisco mais de deriva
    // e si - pero iso e a deriva do corpo, non a caca.
    expect(estadoDe(e, 'malestar')).toBe('locked')

    await e.grantResource('sucidade', 10)
    await reconciliarAutonomos(e, Date.now())
    expect(estadoDe(e, 'malestar')).toBe('unlocked')
  })

  it('limpar apaga a caca e volve armar a dixestion', async () => {
    const e = motor()

    await programarDixestion(e, Date.now())
    vi.setSystemTime(T0 + DIXESTION_MS + 1)
    await reconciliarAutonomos(e, Date.now())
    expect(estadoDe(e, 'caca')).toBe('unlocked')

    await limparCaca(e)
    expect(estadoDe(e, 'caca')).toBe('locked')

    vi.setSystemTime(T0 + 10_000_000)
    await reconciliarAutonomos(e, Date.now())
    expect(estadoDe(e, 'caca')).toBe('locked')
  })
})

describe('regra 4 — os conceptos nacen da situación', () => {
  /** Cría a palabra ata que o bebé a di ben, na situación indicada. */
  async function aprender(e: TreeEngine, palabra: string, referente: 'auga' | 'fame') {
    let familiaridade: Familiaridade = {}
    let referentes: Referentes = {}
    for (let i = 0; i < 20; i += 1) {
      const r = await ensinarPalabra(
        e,
        { referente, forza: 100 },
        familiaridade,
        referentes,
        [],
        palabra,
        i,
      )
      familiaridade = r?.familiaridade ?? familiaridade
      referentes = r?.referentes ?? referentes
    }
    return referentes
  }

  it('dúas palabras aprendidas na MESMA situación fan nacer o concepto', async () => {
    const e = motor()
    const r1 = await aprender(e, 'auga', 'auga')
    const r2 = await aprender(e, 'baño', 'auga')
    const referentes = { ...r1, ...r2 }

    const feitos = await xerarConceptos(e, referentes, 1)
    expect(e.getTreeDef().nodes.some((n) => n.id === 'concepto:auga')).toBe(true)
    expect(feitos.some((f) => f.nodeId === 'concepto:auga')).toBe(true)

    // Nace apagado e acéndeo a regra 1, porque REQUIRE as súas palabras.
    await reconciliarAutonomos(e, 2)
    expect(estadoDe(e, 'concepto:auga')).toBe('unlocked')
  })

  it('funciona con palabras INVENTADAS: xa non depende de ningunha táboa', async () => {
    // Este é o punto. Antes só nacían conceptos coas 28 palabras do
    // léxico; con calquera outra, a rexión CONCEPTOS quedaba baleira
    // para sempre.
    const e = motor()
    const r1 = await aprender(e, 'cadeira', 'fame')
    const r2 = await aprender(e, 'culler', 'fame')

    await xerarConceptos(e, { ...r1, ...r2 }, 1)
    expect(e.getTreeDef().nodes.some((n) => n.id === 'concepto:comida')).toBe(true)
  })

  it('dúas palabras de situacións DISTINTAS non fan concepto ningún', async () => {
    const e = motor()
    const r1 = await aprender(e, 'auga', 'auga')
    const r2 = await aprender(e, 'papa', 'fame')

    await xerarConceptos(e, { ...r1, ...r2 }, 1)
    expect(e.getTreeDef().nodes.filter((n) => n.id.startsWith('concepto:'))).toHaveLength(0)
  })

  it('unha soa palabra non abonda', async () => {
    const e = motor()
    const referentes = await aprender(e, 'auga', 'auga')
    await xerarConceptos(e, referentes, 1)
    expect(e.getTreeDef().nodes.some((n) => n.id === 'concepto:auga')).toBe(false)
  })

  it('unha palabra nova da mesma situación engánchase ao concepto que xa hai', async () => {
    const e = motor()
    const r1 = await aprender(e, 'auga', 'auga')
    const r2 = await aprender(e, 'baño', 'auga')
    await xerarConceptos(e, { ...r1, ...r2 }, 1)
    const antes = e.getTreeDef().edges.filter((x) => x.source === 'concepto:auga').length

    const r3 = await aprender(e, 'limpo', 'auga')
    await xerarConceptos(e, { ...r1, ...r2, ...r3 }, 2)

    // Non se crea outro concepto; énchese o que xa había.
    expect(e.getTreeDef().nodes.filter((n) => n.id === 'concepto:auga')).toHaveLength(1)
    expect(e.getTreeDef().edges.filter((x) => x.source === 'concepto:auga').length).toBe(antes + 1)
  })
})

// ── FIN: probas da política ──
