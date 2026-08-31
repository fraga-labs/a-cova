// ── INICIO: probas da política ──
// Verificamos o CORAZÓN NOVO, non o motor (o motor xa ten as súas).
// Todo isto corre sen navegador: a política é pura respecto de React.

import { TreeEngine } from '@yggdrasil-forge/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DIXESTION_MS, LIMIAR_SUCIDADE } from './drives.js'
import { camposDe, casaConEstimulo, normalizar } from './lexico.js'
import { menteSemente } from './mente-semente.js'
import {
  ESTADO_INICIAL,
  type EstadoPolitica,
  ensinarPalabra,
  esquecer,
  idPalabra,
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

function estado(parcial: Partial<EstadoPolitica> = {}): EstadoPolitica {
  return { ...ESTADO_INICIAL, ...parcial }
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

  it('arranca cos cinco drives no seu valor inicial', () => {
    const e = motor()
    const b = e.getBudget().resources
    expect(Object.keys(b).sort()).toEqual(
      ['apego', 'curiosidade', 'enerxia', 'fame', 'sucidade'].sort(),
    )
    expect(b.sucidade).toBe(8)
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

describe('regra 2 e 3 — a linguaxe por tiers', () => {
  it('unha palabra nova NACE como nodo colgado da voz', async () => {
    const e = motor()
    const r = await ensinarPalabra(e, estado(), 'auga', 1)
    expect(r).not.toBeNull()

    const nodo = e.getTreeDef().nodes.find((n) => n.id === idPalabra('auga'))
    expect(nodo).toBeDefined()
    expect(nodo?.group).toBe('linguaxe')
    expect(nodo?.maxTier).toBe(3)
    expect(e.getTreeDef().edges.some((x) => x.source === 'verbo' && x.target === nodo?.id)).toBe(
      true,
    )
    expect(e.getNodeState(nodo?.id ?? '')?.currentTier).toBe(1)
  })

  it('fóra de contexto quédase en 1/3 por moito que se repita', async () => {
    const e = motor()
    let st = estado({ estimulo: 'nada' })
    for (let i = 0; i < 5; i += 1) {
      const r = await ensinarPalabra(e, st, 'auga', i)
      st = { ...st, frescuras: r?.frescuras ?? {} }
    }
    expect(e.getNodeState(idPalabra('auga'))?.currentTier).toBe(1)
  })

  it('en contexto chega a 3/3 e o nodo queda `maxed`', async () => {
    const e = motor()
    let st = estado({ estimulo: 'auga' })
    let dita = false
    for (let i = 0; i < 3; i += 1) {
      const r = await ensinarPalabra(e, st, 'auga', i)
      st = { ...st, frescuras: r?.frescuras ?? {}, ditas: r?.ditas ?? [] }
      dita = dita || (r?.dita ?? false)
    }
    expect(e.getNodeState(idPalabra('auga'))?.currentTier).toBe(3)
    expect(e.getNodeState(idPalabra('auga'))?.state).toBe('maxed')
    expect(dita).toBe(true)
    expect(st.ditas).toEqual(['auga'])
  })

  it('normaliza acentos: «mamá» e «mama» son a mesma palabra', () => {
    expect(normalizar('  MAMÁ ')).toBe('mama')
    expect(casaConEstimulo('Mamá', 'amor')).toBe(true)
    expect(casaConEstimulo('mamá', 'sono')).toBe(false)
  })
})

describe('regra 4 — os conceptos', () => {
  async function aprender(e: TreeEngine, palabra: string, estimulo: EstadoPolitica['estimulo']) {
    let st = estado({ estimulo })
    for (let i = 0; i < 3; i += 1) {
      const r = await ensinarPalabra(e, st, palabra, i)
      st = { ...st, frescuras: r?.frescuras ?? {} }
    }
  }

  it('dúas palabras a 3/3 do mesmo campo fan nacer o concepto', async () => {
    const e = motor()
    await aprender(e, 'auga', 'auga')
    await aprender(e, 'leite', 'fame')

    expect(camposDe('auga').map((c) => c.id)).toContain('bebida')
    expect(camposDe('leite').map((c) => c.id)).toContain('bebida')

    const feitos = await xerarConceptos(e, 1)
    const concepto = e.getTreeDef().nodes.find((n) => n.id === 'concepto:bebida')
    expect(concepto).toBeDefined()
    expect(feitos.some((f) => f.nodeId === 'concepto:bebida')).toBe(true)

    // Nace apagado e acéndeo a regra 1, porque REQUIRE as súas palabras.
    await reconciliarAutonomos(e, 2)
    expect(estadoDe(e, 'concepto:bebida')).toBe('unlocked')
  })

  it('unha soa palabra non abonda', async () => {
    const e = motor()
    await aprender(e, 'auga', 'auga')
    await xerarConceptos(e, 1)
    expect(e.getTreeDef().nodes.some((n) => n.id === 'concepto:bebida')).toBe(false)
  })
})

describe('regra 5 — o esquecemento', () => {
  it('unha palabra sen reforzo vai perdendo tiers ata desaparecer', async () => {
    const e = motor()
    const r = await ensinarPalabra(e, estado(), 'auga', 1)
    const id = idPalabra('auga')
    expect(e.getNodeState(id)?.currentTier).toBe(1)

    let frescuras = { ...(r?.frescuras ?? {}), [id]: 1 }
    const paso = await esquecer(e, frescuras, 2)
    frescuras = paso.frescuras

    expect(e.getNodeState(id)?.currentTier).toBe(0)
    expect(paso.acontecementos.some((a) => a.texto.includes('esqueceu'))).toBe(true)
    expect(frescuras[id]).toBeUndefined()
  })

  it('unha palabra a 3/3 baixa un chanzo, non se perde de golpe', async () => {
    const e = motor()
    let st = estado({ estimulo: 'auga' })
    for (let i = 0; i < 3; i += 1) {
      const r = await ensinarPalabra(e, st, 'auga', i)
      st = { ...st, frescuras: r?.frescuras ?? {} }
    }
    const id = idPalabra('auga')

    const paso = await esquecer(e, { [id]: 1 }, 4)
    expect(e.getNodeState(id)?.currentTier).toBe(2)
    expect(paso.frescuras[id]).toBeGreaterThan(0)
  })
})
// ── FIN: probas da política ──
