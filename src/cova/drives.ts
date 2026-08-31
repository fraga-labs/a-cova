// ── INICIO: os cinco drives ──
// O bucle do CORPO. Os drives NON son estado inventado: son `resources`
// do documento Yggdrasil, clampeados polo propio motor (`grantResource`
// aplica clamp a [0, resource.max]).

/** Ids dos cinco drives. Coinciden cos `Resource.id` da mente semente. */
export const DRIVES = ['fame', 'enerxia', 'sucidade', 'apego', 'curiosidade'] as const

export type DriveId = (typeof DRIVES)[number]

/**
 * A SOIDADE non é un drive: non ten barra nin o coidador a manexa.
 * É a conta do que non se atendeu. Sobe cando unha necesidade queda sen
 * cubrir e baixa amodo cando si. É un `resource` do documento coma os
 * demais — para que os prerequisitos das sombras se poidan escribir de
 * forma declarativa (`resource_min`) e non como código escondido.
 */
export const SOIDADE = 'soidade' as const

/** Todo o que o motor leva como `resource`: os cinco drives máis a soidade. */
export type RecursoId = DriveId | typeof SOIDADE

export interface DriveSpec {
  readonly id: DriveId
  readonly etiqueta: string
  readonly icona: string
  readonly cor: string
  /** Valor ao nacer. */
  readonly inicial: number
  /** Delta por momento de tempo. Positivo = sobe só. */
  readonly deriva: number
  /**
   * `true` se o valor ALTO é malo (fame, sucidade). Usado só pola UI
   * para decidir se a barra alarma en vermello.
   */
  readonly altoEMalo: boolean
}

/** Un «momento» = un tick do reloxo do corpo. */
export const MOMENTO_MS = 4000

/** Momentos que fan un día na cova. */
export const MOMENTOS_POR_DIA = 60

/** Tempo de dixestión: do biberón á caca. */
export const DIXESTION_MS = 20_000

/**
 * Instante «nunca» para un `time_after` que aínda non foi programado.
 * Constante e serializable a propósito: a mente semente ten que ser un
 * documento válido e determinista, non depender de `Date.now()`.
 * (2100-01-01T00:00:00Z)
 */
export const FUTURO_LONXANO = 4_102_444_800_000

/** Limiar de sucidade que fai nacer o malestar. Espellado no prereq do nodo. */
export const LIMIAR_SUCIDADE = 60

/** Limiar de apego que acende a ledicia. Espellado no prereq do nodo. */
export const LIMIAR_LEDICIA = 80

/** Limiar por debaixo do cal aparece a tristura. Espellado no prereq (`none`). */
export const LIMIAR_TRISTURA = 30

/** Por riba disto, a fame xa non é fame: é desamparo. */
export const LIMIAR_FAME_CRITICA = 90

/** Por debaixo disto, o apego é abandono. */
export const LIMIAR_APEGO_CRITICO = 15

/** Por debaixo disto, non descansou. */
export const LIMIAR_ENERXIA_CRITICA = 10

/** Canto sobe a soidade por cada necesidade crítica sen atender, cada momento. */
export const SOIDADE_POR_DESATENCION = 3

/**
 * Canto baixa a soidade nun momento en que todo está ben.
 * Un terzo do que sobe: aprender a estar só é rápido, desaprendelo non.
 * Esa asimetría é a mecánica; non fai falta ningunha histérese no motor.
 */
export const SOIDADE_QUE_SANDA = 1

export const DRIVE_SPECS: readonly DriveSpec[] = [
  {
    id: 'fame',
    etiqueta: 'fame',
    icona: '🍼',
    cor: '#e08a3c',
    inicial: 42,
    deriva: 2,
    altoEMalo: true,
  },
  {
    id: 'enerxia',
    etiqueta: 'enerxía',
    icona: '⚡',
    cor: '#e8c547',
    inicial: 68,
    deriva: -1,
    altoEMalo: false,
  },
  {
    id: 'sucidade',
    etiqueta: 'sucidade',
    icona: '💩',
    cor: '#9c7248',
    inicial: 8,
    deriva: 1,
    altoEMalo: true,
  },
  {
    id: 'apego',
    etiqueta: 'apego',
    icona: '❤',
    cor: '#e07aa8',
    inicial: 85,
    deriva: -1,
    altoEMalo: false,
  },
  {
    id: 'curiosidade',
    etiqueta: 'curiosidade',
    icona: '✦',
    cor: '#6fbf73',
    inicial: 62,
    deriva: -1,
    altoEMalo: false,
  },
]

export function driveSpec(id: DriveId): DriveSpec {
  const spec = DRIVE_SPECS.find((d) => d.id === id)
  /* c8 ignore next 3 -- defensivo: DRIVES e DRIVE_SPECS están acoplados. */
  if (spec === undefined) {
    throw new Error(`drive descoñecido: ${id}`)
  }
  return spec
}
// ── FIN: os cinco drives ──
