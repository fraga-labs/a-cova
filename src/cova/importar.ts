// ── INICIO: importar bebé ──
// A outra metade da promesa. «Exportar bebé» descargaba un documento
// Yggdrasil e ata aquí non había forma de volvelo meter: nin no teu
// navegador nin no de outra persoa. Un gardado do que non se pode
// volver non é un gardado.
//
// Lese o MESMO ficheiro que escribe `documentoBebe`, sen formato
// paralelo: a mente é o documento, e a crianza vai en `metadata.aCova`.

import type { TreeDef, TreeState } from '@yggdrasil-forge/core'
import type { Acontecemento } from './acontecementos.js'
import type { Gardado } from './persistencia.js'
import { ESTADO_INICIAL, type EstadoPolitica } from './politica.js'

/** O mínimo que precisa `importar` para non perder nada polo camiño. */
const FORMATO_MINIMO = 2

export type Importacion =
  | { readonly ok: true; readonly bebe: Omit<Gardado, 'clave' | 'gardadoEn'> }
  | { readonly ok: false; readonly erro: string }

function ehObxecto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

/**
 * Convirte o texto dun ficheiro exportado nun bebé listo para gardar.
 *
 * Puro: nin toca `localStorage` nin recarga nada. Quen decide se
 * substituír o bebé vivo é a interface, que é quen pode preguntar.
 */
export function lerBebe(texto: string): Importacion {
  let cru: unknown
  try {
    cru = JSON.parse(texto)
  } catch {
    return { ok: false, erro: 'Iso non é un ficheiro JSON.' }
  }

  if (!ehObxecto(cru) || !Array.isArray(cru.nodes)) {
    return { ok: false, erro: 'Iso non parece un documento Yggdrasil.' }
  }

  const meta = ehObxecto(cru.metadata) ? cru.metadata.aCova : undefined
  if (!ehObxecto(meta)) {
    // Un documento Yggdrasil calquera é válido pero non é un bebé: non
    // ten crianza ningunha. Mellor dicilo ca cargalo baleiro.
    return { ok: false, erro: 'É un documento Yggdrasil, pero non un bebé da Cova.' }
  }

  const formato = typeof meta.formato === 'number' ? meta.formato : 0
  if (formato < FORMATO_MINIMO || !ehObxecto(meta.estado)) {
    return {
      ok: false,
      erro: 'Este bebé exportouse cunha versión anterior e non trae o estado da crianza.',
    }
  }

  return {
    ok: true,
    bebe: {
      nome: typeof meta.nome === 'string' && meta.nome !== '' ? meta.nome : 'Meco',
      tree: cru as unknown as TreeDef,
      state: meta.estado as unknown as TreeState,
      // Igual ca en `recuperar`: fusionada sobre a inicial, para que un
      // ficheiro dun día que non tiña un campo non rompa o código de hoxe.
      politica: {
        ...ESTADO_INICIAL,
        ...(ehObxecto(meta.politica) ? (meta.politica as Partial<EstadoPolitica>) : {}),
      },
      acontecementos: Array.isArray(meta.acontecementos)
        ? (meta.acontecementos as readonly Acontecemento[])
        : [],
    },
  }
}
// ── FIN: importar bebé ──
