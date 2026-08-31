// ── INICIO: probas de exportar bebé ──
// A promesa é: «exportar o bebé = un documento Yggdrasil; ábrese no
// editor». Se o documento non valida, a promesa é falsa. Por iso a
// proba non se conforma con mirar o JSON: pásao polo mesmo validador
// que usa `ygg validate`, e deixa o ficheiro en .tmp/ para poder
// pasarlle o CLI de verdade (`npm run verificar`).

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { TreeEngine, isOk, validateTreeDef } from '@yggdrasil-forge/core'
import { describe, expect, it } from 'vitest'
import { documentoBebe, nomeFicheiro } from './exportar.js'
import { menteSemente } from './mente-semente.js'
import { ESTADO_INICIAL, type EstadoPolitica, ensinarPalabra, xerarConceptos } from './politica.js'

const DESTINO = resolve(process.cwd(), '.tmp/bebe-medrado.json')

/** Cría un bebé ata que ten dúas palabras a 3/3 e un concepto nacido. */
async function criar(): Promise<{ engine: TreeEngine; politica: EstadoPolitica }> {
  const engine = new TreeEngine(menteSemente(), { audit: { enabled: true } })
  let politica: EstadoPolitica = { ...ESTADO_INICIAL, dia: 3 }

  for (const [palabra, estimulo] of [
    ['auga', 'auga'],
    ['leite', 'fame'],
  ] as const) {
    politica = { ...politica, estimulo }
    for (let i = 0; i < 3; i += 1) {
      const r = await ensinarPalabra(engine, politica, palabra, i)
      politica = { ...politica, frescuras: r?.frescuras ?? {}, ditas: r?.ditas ?? politica.ditas }
    }
  }
  await xerarConceptos(engine, 1)
  return { engine, politica }
}

describe('exportar bebé', () => {
  it('a mente MEDRADA segue sendo un documento Yggdrasil válido', async () => {
    const { engine, politica } = await criar()

    const doc = documentoBebe({
      nome: 'Meco',
      tree: engine.getTreeDef(),
      state: engine.getSnapshot(),
      politica,
      acontecementos: [],
    })

    // Nodos nacidos en runtime, non declarados na semente.
    expect(doc.nodes.some((n) => n.id === 'palabra:auga')).toBe(true)
    expect(doc.nodes.some((n) => n.id === 'concepto:bebida')).toBe(true)

    const resultado = validateTreeDef(doc)
    if (!isOk(resultado)) {
      throw new Error(`o documento exportado non valida: ${resultado.error.message}`)
    }

    // Deixámolo no disco para que `npm run verificar` lle pase o CLI real.
    mkdirSync(dirname(DESTINO), { recursive: true })
    writeFileSync(DESTINO, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  })

  it('leva a crianza en `metadata.aCova` sen ensuciar o contrato do motor', async () => {
    const { engine, politica } = await criar()
    const doc = documentoBebe({
      nome: 'Meco',
      tree: engine.getTreeDef(),
      state: engine.getSnapshot(),
      politica,
      acontecementos: [],
    })

    const meta = doc.metadata?.aCova as Record<string, unknown>
    expect(meta.nome).toBe('Meco')
    expect(meta.dia).toBe(3)
    expect(meta.aviso).toContain('non ten grounding')
    expect(isOk(validateTreeDef(doc))).toBe(true)
  })

  it('o nome do ficheiro é limpo e leva o día', async () => {
    const { engine, politica } = await criar()
    const nome = nomeFicheiro({
      nome: 'Meco Ñ',
      tree: engine.getTreeDef(),
      state: engine.getSnapshot(),
      politica,
      acontecementos: [],
    })
    expect(nome).toBe('a-cova-meco-dia-3.json')
  })
})
// ── FIN: probas de exportar bebé ──
