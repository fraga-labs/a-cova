// ── INICIO: estrés do reloxo ──
// O layout xa se mediu (`estres-linguaxe.mjs`). Falta a outra metade da
// pregunta «aguanta 200 palabras?»: canto custa UN MOMENTO de reloxo
// cando a mente é grande. O reloxo dispara cada 4 s e fai catro
// percorridos completos da mente (autónomos, conceptos, colocación,
// esquecemento). Se un momento tarda máis do que tarda en chegar o
// seguinte, a partida vai a tiróns.
//
//   node scripts/estres-reloxo.mjs [N]

import { createServer } from 'vite'

const CANTAS = Number(process.argv[2] ?? 200)
const MOMENTO_MS = 4000

const servidor = await createServer({
  configFile: false,
  logLevel: 'silent',
  appType: 'custom',
  server: { middlewareMode: true },
})

try {
  const core = await servidor.ssrLoadModule('/node_modules/@yggdrasil-forge/core/dist/index.js')
  const { menteSemente } = await servidor.ssrLoadModule('/src/cova/mente-semente.ts')
  const { ensinarPalabra, esquecer } = await servidor.ssrLoadModule('/src/cova/linguaxe.ts')
  const { reconciliarAutonomos, xerarConceptos, medirSoidade } = await servidor.ssrLoadModule(
    '/src/cova/politica.ts',
  )
  const { recolocar } = await servidor.ssrLoadModule('/src/cova/colocacion.ts')
  const { xerarSombras } = await servidor.ssrLoadModule('/src/cova/sombras.ts')

  const engine = new core.TreeEngine(menteSemente(), {})
  for (const id of ['eu', 'verbo', 'memoria:nacemento']) {
    await engine.unlock(id)
  }

  let familiaridade = {}
  let ditas = []
  for (let k = 0; k < CANTAS; k += 1) {
    const palabra = `pal${k}a`
    for (let i = 0; i < 12; i += 1) {
      const r = await ensinarPalabra(
        engine,
        { referente: 'auga', forza: 100 },
        familiaridade,
        ditas,
        palabra,
        i,
      )
      if (r === null) break
      familiaridade = r.familiaridade
      ditas = r.ditas
      if (r.producion >= 3) break
    }
  }

  /** Un momento enteiro, igual que o fai `useCova`. */
  async function momento(t) {
    await engine.grantResource('fame', 2)
    await engine.grantResource('enerxia', -1)
    await engine.grantResource('sucidade', 1)
    await engine.grantResource('apego', -1)
    await engine.grantResource('curiosidade', -1)
    await engine.grantResource('soidade', medirSoidade(engine.getBudget().resources, 0))
    engine.tick()
    await xerarSombras(engine, engine.getBudget().resources.soidade ?? 0)
    await reconciliarAutonomos(engine, t)
    await xerarConceptos(engine, t)
    await recolocar(engine)
    const r = await esquecer(engine, familiaridade, t)
    familiaridade = r.familiaridade
  }

  await momento(0) // quente
  const tempos = []
  for (let i = 1; i <= 12; i += 1) {
    const t0 = performance.now()
    await momento(i)
    tempos.push(performance.now() - t0)
  }
  tempos.sort((a, b) => a - b)
  const mediana = tempos[Math.floor(tempos.length / 2)]
  const peor = tempos[tempos.length - 1]

  process.stdout.write(
    [
      `palabras           : ${CANTAS}`,
      `nodos              : ${engine.getTreeDef().nodes.length}`,
      `momento (mediana)  : ${mediana.toFixed(1)} ms`,
      `momento (peor)     : ${peor.toFixed(1)} ms`,
      `orzamento          : ${MOMENTO_MS} ms — uso ${((peor / MOMENTO_MS) * 100).toFixed(1)} %`,
      '',
    ].join('\n'),
  )
} finally {
  await servidor.close()
}
// ── FIN: estrés do reloxo ──
