// ── INICIO: os acontecementos ──
// O que pasou, tipado. Vive nun módulo propio (e non dentro da política)
// porque agora hai dous que os emiten —`politica.ts` e `linguaxe.ts`— e
// se un importase o outro faríase un ciclo.
//
// O `tipo` non é decorado: del dependen a icona da liña temporal E o son
// que se oe. Por iso «oír», «entender» e «dicir» son tipos distintos e
// non un só «tier» con número.

export type TipoAcontecemento =
  | 'accion'
  | 'caca'
  | 'chorar'
  | 'nace-palabra'
  | 'son'
  | 'oe'
  | 'entende'
  | 'di'
  | 'dia'
  | 'nace-concepto'
  | 'nace-memoria'
  | 'esquece'
  | 'auto'
  | 'sombra'

export interface Acontecemento {
  readonly id: string
  readonly tipo: TipoAcontecemento
  /** Hora real, como no mockup: horas de verdade, non ticks abstractos. */
  readonly cando: number
  readonly texto: string
  /** Nodo implicado, se o hai. Permite acender o nodo no grafo. */
  readonly nodeId?: string
}

let contador = 0

export function acontecemento(
  tipo: TipoAcontecemento,
  texto: string,
  agora: number,
  nodeId?: string,
): Acontecemento {
  contador += 1
  return {
    id: `ac-${agora}-${contador}`,
    tipo,
    cando: agora,
    texto,
    ...(nodeId !== undefined && { nodeId }),
  }
}
// ── FIN: os acontecementos ──
