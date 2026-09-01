// ── INICIO: o que pasou mentres non estabas ──
// A tese de TRASPASO é «o bebé só percibe o que ti lle proxectas — e o
// que aprende cando NON vas tamén queda escrito». Ata aquí a segunda
// metade era mentira: o reloxo era un `setInterval` pelado, así que o
// mundo só se movía coa pestana aberta e diante. `persistencia.ts`
// gardaba un `gardadoEn` en cada escritura e ninguén o lía nunca.
//
// Consecuencia: as sombras —o mecanismo máis distintivo que hai aquí—
// só aparecían se deixabas o xogo aberto mirando como o desatendías. A
// ausencia de verdade, a de marchar, non contaba para nada.
//
// Aquí lese ese `gardadoEn` e aplícase o que faltaba.

import type { TreeEngine } from '@yggdrasil-forge/core'
import { type Acontecemento, acontecemento } from './acontecementos.js'
import { DRIVE_SPECS, MOMENTOS_POR_DIA, MOMENTO_MS, SOIDADE } from './drives.js'
import { SEN_ATENCION, esquecer } from './linguaxe.js'
import { type EstadoPolitica, medirSoidade } from './politica.js'
import type { Modificadores } from './sombras.js'

/**
 * Tope do que se pon ao día, en momentos.
 *
 * Tres días da cova. Un día son 60 momentos de catro segundos, así que
 * marchar doce minutos e marchar un mes contan igual. É unha decisión,
 * non unha limitación técnica: sen tope, volver despois dunhas vacacións
 * borraría un vocabulario de douscentas palabras enteiro, e o castigo
 * deixaría de ensinar nada.
 *
 * Aos 180 momentos os drives xa levan moito saturados, a soidade está ao
 * máximo (as catro sombras) e o esquecemento leva 27 puntos á palabra
 * que mellor se di — abonda para que perda o rango pero non para
 * borrala. O que estaba a medio aprender si desaparece. Iso é o que se
 * quere que se sinta.
 */
export const TOPE_AUSENCIA = MOMENTOS_POR_DIA * 3

/**
 * Momentos que se aplican de golpe antes de volver mirar o mundo.
 *
 * Non se pode replicar momento a momento: medido, un momento cunha mente
 * de 200 palabras custa 9,4 ms, e 180 serían case dous segundos de
 * pantalla pillada ao abrir. Pero tampouco se pode facer dun só paso: a
 * soidade depende de cantas necesidades están en crítico NESE intre, e
 * as necesidades van entrando en crítico pouco a pouco. En chanzos de
 * dez a curva séguese ben e o custo baixa a unha vixésima parte.
 */
const CHANZO = 10

export interface Ausencia {
  /** Momentos aplicados de verdade (xa capados). */
  readonly momentos: number
  /** Momentos que se descartaron polo tope. */
  readonly perdoados: number
}

export interface ResultadoAusencia {
  readonly politica: EstadoPolitica
  readonly acontecementos: readonly Acontecemento[]
  readonly ausencia: Ausencia
}

/** Cantos momentos pasaron de verdade entre dous instantes. */
export function momentosEntre(desde: number, ata: number): number {
  return Math.max(0, Math.floor((ata - desde) / MOMENTO_MS))
}

/** «3 días» / «un día» / «uns minutos», para contalo en palabras. */
function contarTempo(momentos: number): string {
  const dias = Math.floor(momentos / MOMENTOS_POR_DIA)
  if (dias >= 2) {
    return `${dias} días`
  }
  if (dias === 1) {
    return 'un día'
  }
  return 'unhas horas'
}

/**
 * Pon o bebé ao día despois dunha ausencia.
 *
 * Non emite os acontecementos de cada momento — serían centos de «vaille
 * esquecendo». Emite UN resumo, que é o que o coidador precisa ler ao
 * volver. Acender nodos, facer nacer sombras e recolocar segue sendo
 * traballo de quen chama, igual ca nun momento normal.
 */
export async function poñerAoDia(
  engine: TreeEngine,
  politica: EstadoPolitica,
  mods: Modificadores,
  desde: number,
  ata: number,
): Promise<ResultadoAusencia | null> {
  const reais = momentosEntre(desde, ata)
  if (reais < 1) {
    return null
  }
  const momentos = Math.min(reais, TOPE_AUSENCIA)

  let familiaridade = politica.familiaridade
  for (let feitos = 0; feitos < momentos; feitos += CHANZO) {
    const paso = Math.min(CHANZO, momentos - feitos)

    for (const spec of DRIVE_SPECS) {
      const deriva = spec.id === 'enerxia' ? spec.deriva + mods.derivaEnerxia : spec.deriva
      if (deriva !== 0) {
        await engine.grantResource(spec.id, deriva * paso)
      }
    }
    // A soidade mídese sobre o mundo tal e como queda ao final do chanzo,
    // igual ca no reloxo normal.
    const soidade = medirSoidade(engine.getBudget().resources, mods.soidadeExtra)
    await engine.grantResource(SOIDADE, soidade * paso)

    // O esquecemento si vai momento a momento: é graduado por rango e
    // cada palabra cae de rango cando cruza o seu limiar, así que
    // aplicalo en bloque saltaríase os cruces.
    for (let i = 0; i < paso; i += 1) {
      familiaridade = (await esquecer(engine, familiaridade, ata)).familiaridade
    }
  }

  const total = politica.momentos + momentos
  const dia = Math.floor(total / MOMENTOS_POR_DIA) + 1

  return {
    politica: {
      ...politica,
      momentos: total,
      dia,
      familiaridade,
      // Non estabas: non hai nada a que estea a atender.
      atencion: SEN_ATENCION,
    },
    acontecementos: [
      acontecemento(
        'ausencia',
        `mentres non estabas pasaron ${contarTempo(momentos)}`,
        ata,
      ),
    ],
    ausencia: { momentos, perdoados: reais - momentos },
  }
}
// ── FIN: o que pasou mentres non estabas ──
