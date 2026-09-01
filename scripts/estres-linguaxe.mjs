// ── INICIO: estrés da linguaxe ──
// «E se xogo un lote de tempo e aprende 200 palabras? Vese algo?»
//
// Non se responde opinando: críase un bebé con N palabras, cálculase o
// MESMO layout que usa a aplicación e mídese se os nodos se pisan.
//
//   node scripts/estres-linguaxe.mjs [N]
//
// Escribe ademais `.tmp/bebe-estres.json` co formato exacto do gardado
// do navegador. Para velo cos ollos, coa app aberta, na consola:
//
//   localStorage.setItem('a-cova:v2', <o contido do ficheiro>)
//   location.reload()

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'

const CANTAS = Number(process.argv[2] ?? 200)

/** Palabras plausibles en galego, feitas de sílabas reais. */
function inventarPalabras(n) {
  const inicios = [
    'ma', 'pa', 'ca', 'to', 'le', 'so', 'bo', 'te', 'mi', 'lu',
    'ne', 'ro', 'fi', 'ga', 'xa', 'be', 'do', 'pi', 'sa', 'no',
  ]
  // Sílabas de máis, a propósito: un coidador real escribe «cadeira»,
  // «bicicleta» ou «cabaliño», non «maa». Coas palabras curtas a medida
  // de solapamento saía 0 e enganaba.
  const medios = ['ri', 'lade', 'mora', 'teli', 'nesa', 'coba', 'sami', 'lote', 'dena', 'xari']
  const fins = ['ela', 'iño', 'ada', 'ente', 'illo', 'anza', 'oira', 'umbre', 'iña', 'ario']
  const palabras = new Set()
  let i = 0
  while (palabras.size < n && i < n * 50) {
    const p =
      inicios[i % inicios.length] +
      medios[Math.floor(i / inicios.length) % medios.length] +
      fins[Math.floor(i / (inicios.length * medios.length)) % fins.length]
    palabras.add(p)
    i += 1
  }
  return [...palabras]
}

const servidor = await createServer({
  configFile: false,
  logLevel: 'silent',
  appType: 'custom',
  server: { middlewareMode: true },
})

try {
  const core = await servidor.ssrLoadModule('/node_modules/@yggdrasil-forge/core/dist/index.js')
  const { menteSemente } = await servidor.ssrLoadModule('/src/cova/mente-semente.ts')
  const { ensinarPalabra } = await servidor.ssrLoadModule('/src/cova/linguaxe.ts')

  const engine = new core.TreeEngine(menteSemente(), {})
  for (const id of ['eu', 'verbo', 'memoria:nacemento']) {
    await engine.unlock(id)
  }

  const palabras = inventarPalabras(CANTAS)
  let familiaridade = {}
  let referentes = {}
  let ditas = []

  // Cada palabra recibe un número distinto de exposicións: unha partida
  // de verdade non ten douscentas palabras todas no mesmo punto, ten
  // unhas cantas que xa di e unha morea que aínda non.
  for (const [orde, palabra] of palabras.entries()) {
    const veces = 2 + (orde % 15)
    for (let i = 0; i < veces; i += 1) {
      const r = await ensinarPalabra(
        engine,
        { referente: 'auga', forza: 100 },
        familiaridade,
        referentes,
        ditas,
        palabra,
        i,
      )
      if (r === null) break
      familiaridade = r.familiaridade
      referentes = r.referentes
      ditas = r.ditas
      if (r.producion >= 3) break
    }
  }

  const { recolocar } = await servidor.ssrLoadModule('/src/cova/colocacion.ts')
  await recolocar(engine)

  const treeDef = engine.getTreeDef()

  // ── A medida ──
  const rexistro = new core.LayoutEngineRegistry()
    .register(new core.ClusteredRadialLayout())
    .register(new core.RadialLayout())
    .register(new core.TreeLayout())
    .register(new core.ConstellationLayout())
    .register(new core.IdentityLayout())

  const layout = core.computeLayout(treeDef, rexistro, 'gl')
  if (!core.isOk(layout)) {
    throw new Error(`o layout fallou: ${layout.error.message}`)
  }

  const posicions = [...layout.value.nodes.entries()]

  // O radio REAL de cada nodo, o mesmo que usa a colocación e o mesmo
  // que debuxa o renderer. Antes aquí había un `const RAIO = 18` a ollo,
  // e por iso este script dicía «0 pisados» mentres o navegador ensinaba
  // memorias solapadas: `caca` mide 34 e un cadrado de 24 chega a 34
  // pola esquina.
  const { raioVisual } = await servidor.ssrLoadModule('/src/cova/colocacion.ts')
  const raioDe = new Map(treeDef.nodes.map((n) => [n.id, raioVisual(n)]))

  let pisados = 0
  let minima = Number.POSITIVE_INFINITY
  const exemplos = []
  for (let i = 0; i < posicions.length; i += 1) {
    for (let j = i + 1; j < posicions.length; j += 1) {
      const [idA, a] = posicions[i]
      const [idB, b] = posicions[j]
      const lim = (raioDe.get(idA) ?? 24) + (raioDe.get(idB) ?? 24)
      const folgura = Math.hypot(a.x - b.x, a.y - b.y) - lim
      if (folgura < minima) minima = folgura
      if (folgura < 0) {
        pisados += 1
        if (exemplos.length < 5) exemplos.push(`${idA} ↔ ${idB} (${folgura.toFixed(0)})`)
      }
    }
  }

  // ── E AGORA O QUE DE VERDADE SE LE: as ETIQUETAS ──
  // Medir só os círculos era enganarse. O que se pisa e fai ilexible o
  // grafo é o texto: unha etiqueta de 12 caracteres a 15 px ocupa uns 96
  // de ancho, moito máis cós 36 do círculo.
  // Medido no navegador: unha etiqueta real mide 12,5 unidades de alto,
  // uns 8,2 por letra, e o renderer pona en `y = 32`.
  const ANCHO_POR_LETRA = 8.2
  const ALTO_ETIQUETA = 13
  const DESPRAZAMENTO = 32
  const MAX_LETRAS = 12 // `theme.sizes.maxLabelChars`
  const caixas = posicions.map(([id, p]) => {
    const nodo = treeDef.nodes.find((n) => n.id === id)
    const texto = typeof nodo?.label === 'string' ? nodo.label : (nodo?.label?.gl ?? id)
    const letras = Math.min(texto.length, MAX_LETRAS)
    const ancho = Math.max((raioDe.get(id) ?? 24) * 2, letras * ANCHO_POR_LETRA)
    return { x: p.x, y: p.y + DESPRAZAMENTO, w: ancho, h: ALTO_ETIQUETA }
  })
  let etiquetasPisadas = 0
  for (let i = 0; i < caixas.length; i += 1) {
    for (let j = i + 1; j < caixas.length; j += 1) {
      const a = caixas[i]
      const b = caixas[j]
      if (
        Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
        Math.abs(a.y - b.y) < (a.h + b.h) / 2
      ) {
        etiquetasPisadas += 1
      }
    }
  }

  const porTier = {}
  for (const n of treeDef.nodes) {
    if (!n.id.startsWith('palabra:')) continue
    const t = engine.getNodeState(n.id)?.currentTier ?? 0
    porTier[t] = (porTier[t] ?? 0) + 1
  }

  const porRexion = {}
  for (const n of treeDef.nodes) {
    const g = n.group ?? '(sen grupo)'
    porRexion[g] = (porRexion[g] ?? 0) + 1
  }

  const b = layout.value.bounds
  process.stdout.write(
    [
      `palabras ensinadas : ${palabras.length}`,
      `nodos totais       : ${treeDef.nodes.length}`,
      `longura media      : ${(palabras.reduce((s2, p) => s2 + p.length, 0) / palabras.length).toFixed(1)} letras`,
      `arestas            : ${treeDef.edges.length}`,
      `nodos por rexión   : ${JSON.stringify(porRexion)}`,
      `palabras por rango : ${JSON.stringify(porTier)}`,
      `lenzo              : ${Math.round(b.maxX - b.minX)} × ${Math.round(b.maxY - b.minY)} unidades`,
      `folgura mínima     : ${minima.toFixed(1)} (por baixo de 0 dous nodos tócanse)`,
      `NODOS que se pisan     : ${pisados}${exemplos.length > 0 ? ` — ${exemplos.join(', ')}` : ''}`,
      `ETIQUETAS que se pisan : ${etiquetasPisadas}`,
      '',
    ].join('\n'),
  )

  const destino = resolve(process.cwd(), '.tmp/bebe-estres.json')
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(
    destino,
    JSON.stringify({
      clave: 'a-cova:v2',
      gardadoEn: 0,
      nome: 'Estrés',
      tree: treeDef,
      state: engine.getSnapshot(),
      politica: {
        momentos: 400,
        dia: 7,
        atencion: { referente: null, forza: 0 },
        familiaridade,
        referentes,
        recentes: [],
        ditas,
      },
      acontecementos: [],
    }),
    'utf8',
  )
  process.stdout.write(`escrito: ${destino}\n`)
} finally {
  await servidor.close()
}
// ── FIN: estrés da linguaxe ──
