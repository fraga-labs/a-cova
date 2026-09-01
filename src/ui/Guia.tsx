// ── INICIO: a guía das primeiras veces ──
// A regra que fai funcionar A Cova non está escrita en ningures: fai
// unha acción e ensina MENTRES dura a atención. Quen abra isto sen que
// llo conten vai escribir palabras coa atención apagada, non vai
// aprender nada e vai pensar que está roto.
//
// Non é un titorial de catro pantallas: é unha liña á vez, sacada do
// estado real, que vai cambiando segundo o coidador avanza. E vaise soa
// en canto o bebé intenta dicir a primeira palabra — a proba de que o
// bucle se entendeu.

import type { JSX } from 'react'
import { useState } from 'react'
import { ESTIMULOS } from '../cova/lexico.js'
import { PREFIXO } from '../cova/rexions.js'
import type { Cova } from '../cova/useCova.js'

const CLAVE = 'a-cova:guia'

function xaVista(): boolean {
  try {
    return window.localStorage.getItem(CLAVE) === 'feita'
  } catch {
    return false
  }
}

function gardarVista(): void {
  try {
    window.localStorage.setItem(CLAVE, 'feita')
  } catch {
    // Sen localStorage a guía volverá aparecer. Non é grave.
  }
}

/** Os tres pasos do bucle, na orde na que se descobren. */
type Paso = 'actuar' | 'ensinar' | 'repetir'

function pasoDe(cova: Cova): Paso {
  if (cova.politica.atencion.referente === null) {
    return 'actuar'
  }
  const haiPalabras = cova.engine
    .getTreeDef()
    .nodes.some((n) => n.id.startsWith(PREFIXO.palabra))
  return haiPalabras ? 'repetir' : 'ensinar'
}

/** Cantas palabras chegaron xa ao primeiro rango de produción. */
function cantasIntenta(cova: Cova): number {
  return cova.engine
    .getTreeDef()
    .nodes.filter(
      (n) =>
        n.id.startsWith(PREFIXO.palabra) &&
        (cova.engine.getNodeState(n.id)?.currentTier ?? 0) >= 1,
    ).length
}

export function Guia({ cova }: { readonly cova: Cova }): JSX.Element | null {
  const [pechada, setPechada] = useState(() => xaVista())

  // Cantas palabras xa intentaba dicir cando ESTE coidador chegou.
  //
  // Que o bebé fale non demostra que ti saibas xogar: se alguén che pasa
  // o seu bebé medrado —que é a graza de exportalo— chégache falando e a
  // guía desaparecía sen que a viras. O que hai que mirar é se apareceu
  // unha palabra nova mentres ti estabas.
  const [aoEntrar] = useState(() => cantasIntenta(cova))

  // O bucle entendeuse: unha palabra nova chegou a intentarse. A guía
  // sobra, e non volve nin ao día seguinte.
  if (!pechada && cantasIntenta(cova) > aoEntrar) {
    gardarVista()
    setPechada(true)
    return null
  }
  if (pechada) {
    return null
  }

  const paso = pasoDe(cova)
  const estimulo = ESTIMULOS[cova.politica.atencion.referente ?? 'nada']

  return (
    <aside className="guia" aria-label="Como se xoga">
      <p className="guia__paso">
        {paso === 'actuar' ? (
          <>
            <strong>Preme unha acción.</strong> O bebé só percibe o que ti lle poñas diante: sen
            iso, unha palabra é ruído con forma.
          </>
        ) : null}
        {paso === 'ensinar' ? (
          <>
            <strong>Agora, sen agardar.</strong> Mentres {estimulo.descricion}, a atención vai
            baixando (a barriña de abaixo). Escribe unha palabra <em>mentres dura</em>: o que lle
            ensines agora queda ligado a iso.
          </>
        ) : null}
        {paso === 'repetir' ? (
          <>
            <strong>Outra vez, e outra.</strong> Unha exposición non ensina nada — fan falta unhas
            nove. Volve premer a acción e repite a mesma palabra ata que a intente dicir.
          </>
        ) : null}
      </p>
      <button
        type="button"
        className="ligazon guia__pechar"
        onClick={() => {
          gardarVista()
          setPechada(true)
        }}
      >
        xa o collín
      </button>
    </aside>
  )
}
// ── FIN: a guía das primeiras veces ──
