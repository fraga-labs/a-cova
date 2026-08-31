// ── INICIO: probas das sombras ──
// O que se proba aquí é o que fai que a pregunta «e non aprende cousas
// malas se pasas del?» teña resposta: a ausencia deixa rexistro, e o
// rexistro non se borra.

import { TreeEngine, isOk, validateTreeDef } from '@yggdrasil-forge/core'
import { describe, expect, it } from 'vitest'
import { LIMIAR_SUCIDADE, SOIDADE_QUE_SANDA } from './drives.js'
import { menteSemente } from './mente-semente.js'
import { medirSoidade, reconciliarAutonomos } from './politica.js'
import {
  SEN_SOMBRAS,
  SOMBRAS,
  idSombra,
  modificadores,
  sombrasAcesas,
  xerarSombras,
} from './sombras.js'

function motor(): TreeEngine {
  return new TreeEngine(menteSemente(), { audit: { enabled: true } })
}

function estadoDe(e: TreeEngine, id: string): string {
  return e.getNodeState(id)?.state ?? 'locked'
}

/** Sobe a soidade ata `valor` e deixa que a mente reaccione. */
async function abandonar(e: TreeEngine, valor: number): Promise<void> {
  await e.grantResource('soidade', valor)
  await xerarSombras(e, e.getBudget().resources.soidade ?? 0)
  await reconciliarAutonomos(e, 1)
}

describe('a conta da ausencia', () => {
  it('non sobe se está todo ben — e mesmo sanda un chisco', () => {
    expect(medirSoidade({ fame: 20, sucidade: 5, apego: 80, enerxia: 70 })).toBe(
      -SOIDADE_QUE_SANDA,
    )
  })

  it('sobe unha vez por cada necesidade crítica sen atender', () => {
    expect(medirSoidade({ fame: 95, sucidade: 5, apego: 80, enerxia: 70 })).toBe(3)
    expect(medirSoidade({ fame: 95, sucidade: 90, apego: 5, enerxia: 2 })).toBe(12)
  })

  it('o silencio faina subir aínda máis rápido', () => {
    expect(medirSoidade({ fame: 95, sucidade: 5, apego: 80, enerxia: 70 }, 1)).toBe(4)
  })

  it('sandar é máis lento ca aprender: a asimetría é a mecánica', () => {
    const sobe = medirSoidade({ fame: 95, sucidade: 90, apego: 80, enerxia: 70 })
    const baixa = -medirSoidade({ fame: 10, sucidade: 0, apego: 90, enerxia: 90 })
    expect(sobe).toBeGreaterThan(baixa * 3)
  })
})

describe('as leccións da ausencia', () => {
  it('un bebé ben coidado nunca chega a ter rexión SOMBRA', async () => {
    const e = motor()
    await xerarSombras(e, 0)
    expect((e.getTreeDef().groups ?? []).some((g) => g.id === 'sombra')).toBe(false)
    expect(sombrasAcesas(e)).toHaveLength(0)
  })

  it('a primeira lección trae consigo a rexión', async () => {
    const e = motor()
    await abandonar(e, 30)

    expect((e.getTreeDef().groups ?? []).some((g) => g.id === 'sombra')).toBe(true)
    expect(estadoDe(e, idSombra('auto-consolo'))).toBe('unlocked')
    expect(sombrasAcesas(e).map((s) => s.id)).toEqual(['auto-consolo'])
  })

  it('cada limiar engade a súa lección, por orde', async () => {
    const e = motor()
    await abandonar(e, 100)
    expect(sombrasAcesas(e).map((s) => s.id)).toEqual(SOMBRAS.map((s) => s.id))
  })

  it('coidalo apágaas — pero o nodo QUEDA na mente para sempre', async () => {
    const e = motor()
    await abandonar(e, 100)
    const nodosConSombra = e.getTreeDef().nodes.filter((n) => n.id.startsWith('sombra:')).length
    expect(nodosConSombra).toBe(SOMBRAS.length)

    await e.grantResource('soidade', -100)
    await reconciliarAutonomos(e, 2)

    expect(sombrasAcesas(e)).toHaveLength(0)
    // A cicatriz apágase; non se borra. E viaxa no documento exportado.
    expect(e.getTreeDef().nodes.filter((n) => n.id.startsWith('sombra:')).length).toBe(
      nodosConSombra,
    )
    expect(estadoDe(e, idSombra('auto-consolo'))).toBe('locked')
  })

  it('non se duplican se se volve pasar polo mesmo limiar', async () => {
    const e = motor()
    await abandonar(e, 40)
    await e.grantResource('soidade', -40)
    await reconciliarAutonomos(e, 2)
    await abandonar(e, 40)

    expect(e.getTreeDef().nodes.filter((n) => n.id === idSombra('auto-consolo'))).toHaveLength(1)
    expect((e.getTreeDef().groups ?? []).filter((g) => g.id === 'sombra')).toHaveLength(1)
  })
})

describe('o que as sombras cambian', () => {
  it('sen sombras, o mundo é o de sempre', () => {
    expect(modificadores([])).toEqual(SEN_SOMBRAS)
  })

  it('calmarse só fai que os aloumiños valgan menos', () => {
    const m = modificadores(SOMBRAS.filter((s) => s.id === 'auto-consolo'))
    expect(m.gananciaApego).toBeLessThan(1)
  })

  it('acaparar é unha adaptación: sacia mellor e ensucia máis', () => {
    const m = modificadores(SOMBRAS.filter((s) => s.id === 'acaparar'))
    expect(m.saciedade).toBeGreaterThan(1)
    expect(m.sucidadeExtra).toBeGreaterThan(0)
  })

  it('deixar de chamar cala ao bebé e afonda a soidade', () => {
    const m = modificadores(SOMBRAS.filter((s) => s.id === 'silencio'))
    expect(m.cala).toBe(true)
    expect(m.soidadeExtra).toBeGreaterThan(0)
  })
})

describe('a mente segue sendo un documento válido con sombras', () => {
  it('as sombras cólganse de `eu` e non rompen o grafo', async () => {
    const e = motor()
    await abandonar(e, 100)

    for (const s of SOMBRAS) {
      const nodeId = idSombra(s.id)
      expect(e.getTreeDef().edges.some((x) => x.source === 'eu' && x.target === nodeId)).toBe(true)
      expect(e.getTreeDef().nodes.find((n) => n.id === nodeId)?.group).toBe('sombra')
    }
  })

  it('unha mente con cicatrices segue pasando `validateTreeDef`', async () => {
    const e = motor()
    await abandonar(e, 100)
    const r = validateTreeDef(e.getTreeDef())
    if (!isOk(r)) {
      throw new Error(`a mente con sombras non valida: ${r.error.message}`)
    }
  })

  it('a sucidade alta por si soa xa alimenta a conta', async () => {
    const e = motor()
    await e.grantResource('sucidade', LIMIAR_SUCIDADE)
    expect(medirSoidade(e.getBudget().resources)).toBeGreaterThan(0)
  })
})
// ── FIN: probas das sombras ──
