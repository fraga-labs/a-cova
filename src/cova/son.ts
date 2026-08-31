// ── INICIO: os sonidiños ──
// Sintetizados na marcha con WebAudio. NADA de ficheiros de audio:
// cero bytes que descargar, cero rutas que romper, e o `dist` segue
// sendo tres ficheiros. Ademais casa co aspecto de consola vella —
// isto é un chip, non unha gravación.
//
// Regras da casa:
//  - o AudioContext créase no primeiro CLIC, non ao cargar (os
//    navegadores bloquean o audio sen xesto do usuario, e con razón);
//  - todo dura menos de medio segundo;
//  - hai botón de silencio e lémbrase.

export type Voz =
  | 'comer'
  | 'limpar'
  | 'xogar'
  | 'aloumiño'
  | 'durmir'
  | 'caca'
  | 'chorar'
  | 'oe'
  | 'entende'
  | 'di'
  | 'concepto'
  | 'memoria'
  | 'esquece'
  | 'sombra'
  | 'dia'

const CLAVE_SILENCIO = 'a-cova:son'

let ctx: AudioContext | null = null
let mestre: GainNode | null = null
let silenciado = ler()

function ler(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_SILENCIO) === 'off'
  } catch {
    return false
  }
}

export function estaSilenciado(): boolean {
  return silenciado
}

export function silenciar(valor: boolean): void {
  silenciado = valor
  try {
    window.localStorage.setItem(CLAVE_SILENCIO, valor ? 'off' : 'on')
  } catch {
    /* modo privado: o son funciona igual, só non se lembra */
  }
}

/**
 * Devolve o contexto, creándoo á primeira. `null` se o navegador non
 * ten WebAudio ou se aínda non houbo xesto do usuario — nese caso
 * simplemente non soa nada, que non é un erro.
 */
function contexto(): AudioContext | null {
  if (silenciado) {
    return null
  }
  if (ctx === null) {
    try {
      ctx = new AudioContext()
      mestre = ctx.createGain()
      mestre.gain.value = 0.18
      mestre.connect(ctx.destination)
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

interface Nota {
  /** Frecuencia en Hz. */
  readonly hz: number
  /** Segundos desde agora. */
  readonly cando?: number
  readonly dur?: number
  readonly vol?: number
  readonly tipo?: OscillatorType
  /** Se se indica, a nota desliza ata esta frecuencia. */
  readonly ata?: number
}

function tocarNotas(notas: readonly Nota[]): void {
  const c = contexto()
  if (c === null || mestre === null) {
    return
  }
  const agora = c.currentTime
  for (const n of notas) {
    const inicio = agora + (n.cando ?? 0)
    const dur = n.dur ?? 0.09
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = n.tipo ?? 'square'
    osc.frequency.setValueAtTime(n.hz, inicio)
    if (n.ata !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, n.ata), inicio + dur)
    }
    // Envolvente curtiña: ataque instantáneo e caída suave, que é o que
    // fai que soe a chip e non a pitido.
    const vol = n.vol ?? 0.6
    g.gain.setValueAtTime(0.0001, inicio)
    g.gain.exponentialRampToValueAtTime(vol, inicio + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur)
    osc.connect(g)
    g.connect(mestre)
    osc.start(inicio)
    osc.stop(inicio + dur + 0.02)
  }
}

/** Rebordo de ruído curto: úsase para a auga e para a caca. */
function tocarRuido(dur: number, vol: number, filtro: number): void {
  const c = contexto()
  if (c === null || mestre === null) {
    return
  }
  const mostras = Math.floor(c.sampleRate * dur)
  const buffer = c.createBuffer(1, mostras, c.sampleRate)
  const datos = buffer.getChannelData(0)
  for (let i = 0; i < mostras; i += 1) {
    // Decae ao longo do buffer para que non soe a estática plana.
    datos[i] = (Math.random() * 2 - 1) * (1 - i / mostras)
  }
  const fonte = c.createBufferSource()
  fonte.buffer = buffer
  const paso = c.createBiquadFilter()
  paso.type = 'bandpass'
  paso.frequency.value = filtro
  const g = c.createGain()
  g.gain.value = vol
  fonte.connect(paso)
  paso.connect(g)
  g.connect(mestre)
  fonte.start()
}

const RECEITAS: Record<Voz, () => void> = {
  // Tragar: dous golpes graves e curtos.
  comer: () => {
    tocarNotas([
      { hz: 300, ata: 180, dur: 0.07, tipo: 'triangle' },
      { hz: 240, ata: 140, dur: 0.09, cando: 0.09, tipo: 'triangle' },
    ])
  },
  // Auga: un chorriño agudo cara arriba.
  limpar: () => {
    tocarRuido(0.22, 0.16, 2600)
    tocarNotas([
      { hz: 880, cando: 0.02, dur: 0.06, vol: 0.3, tipo: 'sine' },
      { hz: 1174, cando: 0.08, dur: 0.06, vol: 0.3, tipo: 'sine' },
      { hz: 1568, cando: 0.14, dur: 0.09, vol: 0.28, tipo: 'sine' },
    ])
  },
  // Pelota: un chimpo.
  xogar: () => {
    tocarNotas([
      { hz: 523, ata: 1046, dur: 0.08 },
      { hz: 1046, ata: 784, dur: 0.1, cando: 0.08 },
    ])
  },
  // Aloumiño: dúas notas cálidas, quinta xusta.
  aloumiño: () => {
    tocarNotas([
      { hz: 392, dur: 0.16, vol: 0.4, tipo: 'sine' },
      { hz: 587, dur: 0.24, vol: 0.4, cando: 0.1, tipo: 'sine' },
    ])
  },
  // Sono: unha caída lenta e grave.
  durmir: () => {
    tocarNotas([{ hz: 330, ata: 130, dur: 0.5, vol: 0.35, tipo: 'sine' }])
  },
  // A caca merece a súa dignidade cómica.
  caca: () => {
    tocarNotas([{ hz: 200, ata: 60, dur: 0.28, vol: 0.5, tipo: 'sawtooth' }])
    tocarRuido(0.18, 0.12, 400)
  },
  // Choro: dúas notas que oscilan, en menor.
  chorar: () => {
    tocarNotas([
      { hz: 622, ata: 523, dur: 0.18, vol: 0.35, tipo: 'triangle' },
      { hz: 587, ata: 466, dur: 0.24, vol: 0.35, cando: 0.2, tipo: 'triangle' },
    ])
  },
  // Os tres chanzos da palabra: unha nota, dúas, tres cara arriba.
  oe: () => {
    tocarNotas([{ hz: 523, dur: 0.07, vol: 0.35 }])
  },
  entende: () => {
    tocarNotas([
      { hz: 523, dur: 0.07, vol: 0.35 },
      { hz: 659, dur: 0.09, vol: 0.35, cando: 0.08 },
    ])
  },
  di: () => {
    tocarNotas([
      { hz: 523, dur: 0.07, vol: 0.4 },
      { hz: 659, dur: 0.07, vol: 0.4, cando: 0.08 },
      { hz: 784, dur: 0.07, vol: 0.4, cando: 0.16 },
      { hz: 1046, dur: 0.2, vol: 0.45, cando: 0.24 },
    ])
  },
  // Concepto: acorde, porque a mente gaña un piso.
  concepto: () => {
    tocarNotas([
      { hz: 523, dur: 0.3, vol: 0.28, tipo: 'triangle' },
      { hz: 659, dur: 0.3, vol: 0.28, tipo: 'triangle' },
      { hz: 784, dur: 0.34, vol: 0.28, tipo: 'triangle' },
    ])
  },
  memoria: () => {
    tocarNotas([
      { hz: 1046, dur: 0.1, vol: 0.3, tipo: 'sine' },
      { hz: 1568, dur: 0.28, vol: 0.26, cando: 0.09, tipo: 'sine' },
    ])
  },
  // Esquecer: a mesma figura, ao revés e apagada.
  esquece: () => {
    tocarNotas([
      { hz: 659, dur: 0.09, vol: 0.22, tipo: 'sine' },
      { hz: 440, dur: 0.16, vol: 0.18, cando: 0.09, tipo: 'sine' },
    ])
  },
  // Sombra: grave, desafinada consigo mesma. Non é un premio.
  sombra: () => {
    tocarNotas([
      { hz: 110, dur: 0.55, vol: 0.4, tipo: 'sawtooth' },
      { hz: 116, dur: 0.55, vol: 0.3, tipo: 'sawtooth' },
      { hz: 220, ata: 174, dur: 0.4, vol: 0.2, cando: 0.12, tipo: 'triangle' },
    ])
  },
  dia: () => {
    tocarNotas([
      { hz: 784, dur: 0.14, vol: 0.25, tipo: 'sine' },
      { hz: 1046, dur: 0.26, vol: 0.25, cando: 0.12, tipo: 'sine' },
    ])
  },
}

export function tocar(voz: Voz): void {
  RECEITAS[voz]()
}

/**
 * Escala pentatónica: soe o que soe, non desafina. Serve para o
 * balbucido, que ten que quedar mono e non aleatorio-molesto.
 */
const PENTATONICA = [523, 587, 659, 784, 880, 1046]

/**
 * Converte a palabra nunha secuencia de notas SEMPRE A MESMA para a
 * mesma palabra: «auga» soa igual as tres veces que a diga. Iso é o que
 * fai que pareza a súa voz e non ruído.
 *
 * Puro e exportado para poder probalo sen navegador.
 */
export function balbucido(palabra: string): readonly number[] {
  const letras = [...palabra].filter((c) => /[a-zñáéíóúü]/i.test(c))
  const notas: number[] = []
  for (const letra of letras.slice(0, 6)) {
    const i = letra.toLowerCase().charCodeAt(0) % PENTATONICA.length
    notas.push(PENTATONICA[i] ?? 523)
  }
  return notas.length > 0 ? notas : [523]
}

/** A voz do bebé: unha nota curta por letra. Non é fala, é balbucido. */
export function balbucir(palabra: string): void {
  tocarNotas(
    balbucido(palabra).map((hz, i) => ({
      hz,
      cando: i * 0.11,
      dur: 0.09,
      vol: 0.32,
      tipo: 'triangle' as const,
    })),
  )
}
// ── FIN: os sonidiños ──
