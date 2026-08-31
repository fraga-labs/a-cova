// ── INICIO: os cinco drives ──
// O bucle do CORPO. Os drives NON son estado inventado: son `resources`
// do documento Yggdrasil, clampeados polo propio motor (`grantResource`
// aplica clamp a [0, resource.max]).

/** Ids dos cinco drives. Coinciden cos `Resource.id` da mente semente. */
export const DRIVES = ['fame', 'enerxia', 'sucidade', 'apego', 'curiosidade'] as const

export type DriveId = (typeof DRIVES)[number]

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
