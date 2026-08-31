// ── INICIO: useSons ──
// O son vive AQUÍ, na capa de presentación, e non na política. A
// política emite acontecementos tipados; esta táboa decide como soan.
// Así `politica.ts` segue sendo probable sen navegador nin WebAudio.

import { useEffect, useRef } from 'react'
import type { Acontecemento, TipoAcontecemento } from '../cova/acontecementos.js'
import { type Voz, balbucir, tocar } from '../cova/son.js'
import type { Cova } from '../cova/useCova.js'

/** Que soa con cada tipo de acontecemento. `null` = non soa nada. */
const VOCES: Record<TipoAcontecemento, Voz | null> = {
  accion: null, // xa soa a acción concreta, máis abaixo
  caca: 'caca',
  chorar: 'chorar',
  'nace-palabra': null, // vén sempre seguido dun «oe» ou «entende»
  son: 'concepto', // gañar un son é un fito pequeno pero real
  oe: 'oe',
  entende: 'entende',
  di: 'di',
  dia: 'dia',
  'nace-concepto': 'concepto',
  'nace-memoria': 'memoria',
  esquece: 'esquece',
  auto: null, // depende do nodo; resólvese abaixo
  sombra: 'sombra',
}

/** Os autónomos que si teñen voz propia. */
const VOCES_AUTO: Record<string, Voz> = {
  caca: 'caca',
  malestar: 'chorar',
}

const VOCES_ACCION: Record<string, Voz> = {
  'deuslle de comer': 'comer',
  limpáchelo: 'limpar',
  'xogastes xuntos': 'xogar',
  'un aloumiño': 'aloumiño',
  'botou un sono': 'durmir',
}

/**
 * Canto «pesa» cada voz. Nun lote de varios acontecementos non se sóan
 * todos (sería ruído) nin se sóa simplemente o último (a primeira vez
 * que unha palabra chega a 3/3 tamén nace unha memoria, e sen pesos
 * gañaba a memoria — tapando xusto o momento que se quere celebrar).
 */
const PESOS: Record<Voz, number> = {
  di: 100,
  concepto: 90,
  sombra: 85,
  caca: 80,
  chorar: 75,
  memoria: 60,
  entende: 50,
  dia: 45,
  esquece: 40,
  oe: 30,
  comer: 20,
  limpar: 20,
  xogar: 20,
  aloumiño: 20,
  durmir: 20,
}

/** A voz dun acontecemento concreto, ou `null` se ese non soa. */
function vozDe(a: Acontecemento): Voz | null {
  if (a.tipo === 'accion') {
    return VOCES_ACCION[a.texto] ?? null
  }
  if (a.tipo === 'auto') {
    return a.nodeId === undefined ? null : (VOCES_AUTO[a.nodeId] ?? null)
  }
  return VOCES[a.tipo]
}

/**
 * Soan DÚAS cousas como moito por lote: o que fixeches (resposta
 * inmediata ao botón) e a consecuencia máis importante do que pasou,
 * un chisco despois para que non choquen. «Premín limpar → e ademais
 * naceu unha memoria» lese; cinco pitidos á vez, non.
 */
export function useSons(cova: Cova): void {
  const ultimoVisto = useRef<string | null>(null)

  useEffect(() => {
    const lista = cova.acontecementos
    const primeiro = lista[0]
    if (primeiro === undefined || primeiro.id === ultimoVisto.current) {
      return
    }
    // Na primeira pasada só tomamos nota: se non, ao recargar a páxina
    // soaría o último acontecemento da sesión anterior.
    const vistoAntes = ultimoVisto.current
    ultimoVisto.current = primeiro.id
    if (vistoAntes === null) {
      return
    }

    const corte = lista.findIndex((a) => a.id === vistoAntes)
    const lote = lista.slice(0, corte === -1 ? lista.length : corte)

    const accion = lote.find((a) => a.tipo === 'accion')
    const vozAccion = accion === undefined ? null : vozDe(accion)
    if (vozAccion !== null) {
      tocar(vozAccion)
    }

    let mellor: Voz | null = null
    for (const a of lote) {
      if (a.tipo === 'accion') {
        continue
      }
      const voz = vozDe(a)
      if (voz !== null && (mellor === null || PESOS[voz] > PESOS[mellor])) {
        mellor = voz
      }
    }
    if (mellor === null) {
      return
    }
    if (vozAccion === null) {
      tocar(mellor)
      return
    }
    const consecuencia = mellor
    const id = window.setTimeout(() => {
      tocar(consecuencia)
    }, 200)
    return () => {
      window.clearTimeout(id)
    }
  }, [cova.acontecementos])

  // A voz do bebé cando di unha palabra: vai aparte porque non é un
  // acontecemento, é o bocadillo. Soa xusto despois do arpexo do 3/3.
  const ultimaDita = useRef<string | null>(null)
  useEffect(() => {
    if (cova.di === null) {
      ultimaDita.current = null
      return
    }
    if (cova.di === ultimaDita.current) {
      return
    }
    ultimaDita.current = cova.di
    const id = window.setTimeout(() => {
      balbucir(cova.di ?? '')
    }, 420)
    return () => {
      window.clearTimeout(id)
    }
  }, [cova.di])
}
// ── FIN: useSons ──
