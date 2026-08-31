// ── INICIO: persistencia ──
// Decisión 3 do dono: navegador. localStorage con clave VERSIONADA
// (se cambia o formato, o gardado vello ignórase en vez de romper) +
// EXPORTAR BEBÉ como gardado de verdade.

import type { TreeDef, TreeState } from '@yggdrasil-forge/core'
import type { Acontecemento } from './acontecementos.js'
import { ESTADO_INICIAL, type EstadoPolitica } from './politica.js'

// v2: a política cambiou de forma coa reforma da linguaxe (fóra
// `estimulo`/`frescuras`, dentro `atencion`). A clave vai versionada
// precisamente para isto: un gardado vello ignórase en vez de romper.
export const CLAVE = 'a-cova:v2'

export interface Gardado {
  readonly clave: typeof CLAVE
  readonly gardadoEn: number
  readonly nome: string
  readonly tree: TreeDef
  readonly state: TreeState
  readonly politica: EstadoPolitica
  readonly acontecementos: readonly Acontecemento[]
}

export function gardar(g: Omit<Gardado, 'clave' | 'gardadoEn'>): void {
  try {
    const payload: Gardado = { ...g, clave: CLAVE, gardadoEn: Date.now() }
    window.localStorage.setItem(CLAVE, JSON.stringify(payload))
  } catch {
    // Modo privado, cota chea, storage bloqueado: o bebé segue vivo en
    // memoria e EXPORTAR BEBÉ segue funcionando. Non rompemos a sesión
    // por non poder gardar.
  }
}

export function recuperar(): Gardado | null {
  try {
    const cru = window.localStorage.getItem(CLAVE)
    if (cru === null) {
      return null
    }
    const dato = JSON.parse(cru) as Partial<Gardado>
    if (dato.clave !== CLAVE || dato.tree === undefined || dato.state === undefined) {
      return null
    }
    // A política vai SEMPRE fusionada sobre a inicial. Un gardado feito
    // cunha versión anterior non ten os campos que se engadiron despois,
    // e sen isto o código novo rompía ao tocalos (`p.recentes.filter` de
    // `undefined`) — e rompía en silencio, porque a cola de mutacións
    // captura os erros. Custounos dúas voltas atopalo.
    return {
      ...dato,
      politica: { ...ESTADO_INICIAL, ...(dato.politica ?? {}) },
      acontecementos: dato.acontecementos ?? [],
      nome: dato.nome ?? 'Meco',
    } as Gardado
  } catch {
    return null
  }
}

export function esquecerTodo(): void {
  try {
    window.localStorage.removeItem(CLAVE)
  } catch {
    /* ver `gardar` */
  }
}
// ── FIN: persistencia ──
