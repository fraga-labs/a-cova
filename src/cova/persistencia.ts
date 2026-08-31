// ── INICIO: persistencia ──
// Decisión 3 do dono: navegador. localStorage con clave VERSIONADA
// (se cambia o formato, o gardado vello ignórase en vez de romper) +
// EXPORTAR BEBÉ como gardado de verdade.

import type { TreeDef, TreeState } from '@yggdrasil-forge/core'
import type { Acontecemento, EstadoPolitica } from './politica.js'

export const CLAVE = 'a-cova:v1'

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
    return dato as Gardado
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
