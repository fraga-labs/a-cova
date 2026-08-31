// ── INICIO: mente-a-json ──
// Emite a mente semente como documento Yggdrasil para poder pasarlle
// `ygg validate`. A mente semente é código TypeScript (para que o
// compilador nos protexa), pero o contrato é un DOCUMENTO — e o
// documento valídase desde o día un.
//
//   node scripts/mente-a-json.mjs                 → stdout
//   node scripts/mente-a-json.mjs --out f.json    → ficheiro
//
// Carga o .ts a través de Vite (que xa é dependencia) porque é quen
// resolve o especificador `./drives.js` → `drives.ts` do estilo TS.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'

const servidor = await createServer({
  configFile: false,
  logLevel: 'silent',
  appType: 'custom',
  server: { middlewareMode: true },
})

let doc
try {
  const modulo = await servidor.ssrLoadModule('/src/cova/mente-semente.ts')
  doc = JSON.stringify(modulo.menteSemente(), null, 2)
} finally {
  await servidor.close()
}

const i = process.argv.indexOf('--out')
if (i !== -1 && process.argv[i + 1] !== undefined) {
  const destino = resolve(process.cwd(), process.argv[i + 1])
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, `${doc}\n`, 'utf8')
  process.stdout.write(`escrito: ${destino}\n`)
} else {
  process.stdout.write(`${doc}\n`)
}
// ── FIN: mente-a-json ──
