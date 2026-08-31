// ── INICIO: a mente semente ──
// A mente coa que nace o bebé: un documento Yggdrasil VÁLIDO (`ygg validate`
// desde o día un). Todo o que non estea aquí, non existe para el — e só
// existirá se o coidador llo ensina. Esa é a cova.
//
// As cinco rexións do mockup son `groups`; o layout `clustered-radial`
// coloca cada grupo arredor do centro e orbita os seus membros arredor
// da áncora do grupo. Iso importa para o crecemento en runtime: un nodo
// que nace só ten que declarar o seu `group` — a posición vén dada.

import { SCHEMA_VERSION } from '@yggdrasil-forge/common'
import type { NodeDef, TreeDef } from '@yggdrasil-forge/core'
import {
  DRIVE_SPECS,
  FUTURO_LONXANO,
  SOIDADE,
  LIMIAR_LEDICIA,
  LIMIAR_SUCIDADE,
  LIMIAR_TRISTURA,
} from './drives.js'

/** Ids das cinco rexións da mente. */
export const REXIONS = {
  corpo: 'corpo',
  linguaxe: 'linguaxe',
  afectos: 'afectos',
  conceptos: 'conceptos',
  memorias: 'memorias',
  // A SOMBRA non ten nodos na semente e o seu grupo tampouco se declara
  // aquí: nace coa primeira leccion da ausencia (ver sombras.ts). Un bebe
  // ben coidado nunca chega a ver esta rexion.
  sombra: 'sombra',
} as const

export type RexionId = (typeof REXIONS)[keyof typeof REXIONS]

export const COR_REXION: Record<RexionId, string> = {
  corpo: '#e08a3c',
  linguaxe: '#a97ae0',
  afectos: '#e07aa8',
  conceptos: '#6fbf73',
  memorias: '#5aa9e0',
  sombra: '#8a8f9c',
}

export const ETIQUETA_REXION: Record<RexionId, string> = {
  corpo: 'CORPO',
  linguaxe: 'LINGUAXE',
  afectos: 'AFECTOS',
  conceptos: 'CONCEPTOS',
  memorias: 'MEMORIAS',
  sombra: 'SOMBRA',
}

/**
 * Tag que marca un nodo como AUTÓNOMO: a política de crecemento
 * desbloquéao (e volve bloquealo) soa en canto o seu prerequisito
 * pasa a estar satisfeito (ou deixa de estalo).
 *
 * O motor NON fai isto por si: `TreeEngine` nunca move un nodo de
 * `locked` a `unlockable`/`unlocked` sen que alguén chame `unlock()`.
 * Ver docs/ACHADOS.md (achado 1).
 */
export const TAG_AUTO = 'auto'

/** Prefixos de id por familia de nodo nacido en runtime. */
export const PREFIXO = {
  palabra: 'palabra:',
  concepto: 'concepto:',
  memoria: 'memoria:',
} as const

const nodosCorpo: readonly NodeDef[] = [
  {
    id: 'fame',
    type: 'notable',
    group: REXIONS.corpo,
    icon: '🍼',
    color: '#e08a3c',
    label: { gl: 'fame', es: 'hambre', en: 'hunger' },
    description: { gl: 'O baleiro que manda.' },
    tags: [REXIONS.corpo, 'drive'],
  },
  {
    id: 'enerxia',
    type: 'small',
    group: REXIONS.corpo,
    icon: '⚡',
    color: '#e8c547',
    label: { gl: 'enerxía', es: 'energía', en: 'energy' },
    tags: [REXIONS.corpo, 'drive'],
  },
  {
    id: 'sucidade',
    type: 'small',
    group: REXIONS.corpo,
    icon: '🧼',
    color: '#9c7248',
    label: { gl: 'sucidade', es: 'suciedad', en: 'dirt' },
    tags: [REXIONS.corpo, 'drive'],
  },
  {
    // A CACA. Con toda a súa dignidade cómica.
    // O prerequisito é temporal: ao alimentar, a política reescribe este
    // `time_after` a `agora + DIXESTION_MS` (applyChanges/modify_node).
    // Ao limpar, devólveo a FUTURO_LONXANO e bloquea o nodo.
    id: 'caca',
    type: 'keystone',
    group: REXIONS.corpo,
    icon: '💩',
    color: '#8a6a4a',
    label: { gl: 'caca', es: 'caca', en: 'poop' },
    description: { gl: 'O que entra, sae. A primeira lei da cova.' },
    tags: [REXIONS.corpo, TAG_AUTO],
    prerequisites: { type: 'time_after', timestamp: FUTURO_LONXANO },
    effects: [
      { type: 'modify_resource', resourceId: 'sucidade', op: '+', amount: 45 },
      { type: 'trigger_event', eventName: 'cova:caca' },
    ],
  },
  {
    // Non limpar ten consecuencia. O nodo acéndese só.
    id: 'malestar',
    type: 'notable',
    group: REXIONS.corpo,
    icon: '😖',
    color: '#c1442e',
    label: { gl: 'malestar', es: 'malestar', en: 'discomfort' },
    description: { gl: 'Estar sucio dóe. Aprendeuno el só.' },
    tags: [REXIONS.corpo, TAG_AUTO],
    prerequisites: { type: 'resource_min', resourceId: 'sucidade', amount: LIMIAR_SUCIDADE },
    effects: [
      { type: 'modify_resource', resourceId: 'apego', op: '-', amount: 8 },
      { type: 'trigger_event', eventName: 'cova:chorar' },
    ],
  },
]

const nodosAfectos: readonly NodeDef[] = [
  {
    id: 'apego',
    type: 'notable',
    group: REXIONS.afectos,
    icon: '❤',
    color: '#e07aa8',
    label: { gl: 'apego', es: 'apego', en: 'attachment' },
    description: { gl: 'A corda que o ata a quen o coida.' },
    tags: [REXIONS.afectos, 'drive'],
  },
  {
    id: 'ledicia',
    type: 'small',
    group: REXIONS.afectos,
    icon: '😀',
    color: '#e8c547',
    label: { gl: 'ledicia', es: 'alegría', en: 'joy' },
    tags: [REXIONS.afectos, TAG_AUTO],
    prerequisites: { type: 'resource_min', resourceId: 'apego', amount: LIMIAR_LEDICIA },
  },
  {
    // `none` = NOT. Así se expresa «apego POR DEBAIXO de 30» sen que
    // exista unha condición `resource_max` no motor.
    id: 'tristura',
    type: 'small',
    group: REXIONS.afectos,
    icon: '😢',
    color: '#5aa9e0',
    label: { gl: 'tristura', es: 'tristeza', en: 'sadness' },
    tags: [REXIONS.afectos, TAG_AUTO],
    prerequisites: {
      type: 'none',
      conditions: [{ type: 'resource_min', resourceId: 'apego', amount: LIMIAR_TRISTURA }],
    },
  },
]

const nodosLinguaxe: readonly NodeDef[] = [
  {
    // A áncora da rexión: a voz. Existe desde o nacemento e é de onde
    // colgan todas as palabras que nazan.
    id: 'verbo',
    type: 'notable',
    group: REXIONS.linguaxe,
    icon: '💬',
    color: '#a97ae0',
    label: { gl: 'a voz', es: 'la voz', en: 'the voice' },
    description: { gl: 'Aínda non di nada. Pero escoita.' },
    tags: [REXIONS.linguaxe],
  },
  {
    // O «+ máis» do mockup: a affordance de crecemento visible NO grafo.
    // Nunca se desbloquea; é unha promesa, non un nodo funcional.
    id: 'mais',
    type: 'milestone',
    group: REXIONS.linguaxe,
    icon: '＋',
    color: '#6b5b8a',
    label: { gl: '+ máis', es: '+ más', en: '+ more' },
    description: { gl: 'O que aínda non lle ensinaches.' },
    tags: [REXIONS.linguaxe, 'promesa'],
  },
]

const nodosConceptos: readonly NodeDef[] = [
  {
    // Áncora baleira da rexión Conceptos: os conceptos reais nacen
    // cando dúas palabras a 3/3 comparten campo semántico.
    id: 'nocion',
    type: 'cluster',
    group: REXIONS.conceptos,
    icon: '◇',
    color: '#6fbf73',
    label: { gl: 'nocións', es: 'nociones', en: 'notions' },
    description: { gl: 'O piso de arriba da mente. Aínda baleiro.' },
    tags: [REXIONS.conceptos],
  },
]

const nodosMemorias: readonly NodeDef[] = [
  {
    id: 'memoria:nacemento',
    type: 'milestone',
    group: REXIONS.memorias,
    icon: '✦',
    color: '#5aa9e0',
    label: { gl: 'nacemento', es: 'nacimiento', en: 'birth' },
    description: { gl: 'Abriu os ollos e alguén estaba alí.' },
    tags: [REXIONS.memorias, 'memoria'],
  },
]

/**
 * Nodos que xa están acesos ao nacer. Todo o demais arranca `locked`
 * — literalmente: aínda non existe para el.
 */
export const NODOS_AO_NACER: readonly string[] = ['eu', 'verbo', 'memoria:nacemento']

export function menteSemente(): TreeDef {
  return {
    id: 'a-cova-mente',
    schemaVersion: SCHEMA_VERSION,
    version: '0.1.0',
    label: { gl: 'A mente do bebé', es: 'La mente del bebé', en: 'The baby mind' },
    description: {
      gl: 'A mente enteira dun bebé criado nunha cova: só o que o coidador proxectou nela.',
    },
    author: 'Agarfal',
    rootNodeId: 'eu',
    layout: {
      type: 'clustered-radial',
      groupRadius: 280,
      orbitRadius: 104,
      memberLayout: 'cluster',
      clusterArc: Math.PI * 1.2,
      meshType: 'spokes',
      curve: 'radial',
    },
    resources: [
      ...DRIVE_SPECS.map((d) => ({
        id: d.id,
        label: { gl: d.etiqueta },
        icon: d.icona,
        color: d.cor,
        initial: d.inicial,
        max: 100,
      })),
      {
        // Sen barra na UI a propósito: o coidador non manexa isto, sofreo.
        id: SOIDADE,
        label: { gl: 'soidade' },
        icon: '🕳',
        color: '#8a8f9c',
        initial: 0,
        max: 100,
      },
    ],
    startingBudget: {
      resources: {
        ...Object.fromEntries(DRIVE_SPECS.map((d) => [d.id, d.inicial])),
        [SOIDADE]: 0,
      },
    },
    groups: [
      {
        id: REXIONS.corpo,
        label: { gl: ETIQUETA_REXION.corpo },
        color: COR_REXION.corpo,
        anchorNodeId: 'fame',
      },
      {
        id: REXIONS.linguaxe,
        label: { gl: ETIQUETA_REXION.linguaxe },
        color: COR_REXION.linguaxe,
        anchorNodeId: 'verbo',
      },
      {
        id: REXIONS.afectos,
        label: { gl: ETIQUETA_REXION.afectos },
        color: COR_REXION.afectos,
        anchorNodeId: 'apego',
      },
      {
        id: REXIONS.conceptos,
        label: { gl: ETIQUETA_REXION.conceptos },
        color: COR_REXION.conceptos,
        anchorNodeId: 'nocion',
      },
      {
        id: REXIONS.memorias,
        label: { gl: ETIQUETA_REXION.memorias },
        color: COR_REXION.memorias,
        anchorNodeId: 'memoria:nacemento',
      },
    ],
    nodes: [
      {
        id: 'eu',
        type: 'root',
        icon: '◉',
        color: '#f0e6d2',
        label: { gl: 'eu', es: 'yo', en: 'me' },
        description: { gl: 'O centro da cova. O único que non lle ensinou ninguén.' },
      },
      ...nodosCorpo,
      ...nodosAfectos,
      ...nodosLinguaxe,
      ...nodosConceptos,
      ...nodosMemorias,
    ],
    edges: [
      { id: 'e-eu-fame', source: 'eu', target: 'fame', type: 'dependency' },
      { id: 'e-eu-apego', source: 'eu', target: 'apego', type: 'dependency' },
      { id: 'e-eu-verbo', source: 'eu', target: 'verbo', type: 'dependency' },
      { id: 'e-eu-nocion', source: 'eu', target: 'nocion', type: 'dependency' },
      { id: 'e-eu-memoria', source: 'eu', target: 'memoria:nacemento', type: 'dependency' },
      { id: 'e-fame-enerxia', source: 'fame', target: 'enerxia', type: 'path' },
      { id: 'e-fame-caca', source: 'fame', target: 'caca', type: 'dependency' },
      { id: 'e-caca-sucidade', source: 'caca', target: 'sucidade', type: 'dependency' },
      { id: 'e-sucidade-malestar', source: 'sucidade', target: 'malestar', type: 'dependency' },
      { id: 'e-malestar-apego', source: 'malestar', target: 'apego', type: 'path' },
      { id: 'e-apego-ledicia', source: 'apego', target: 'ledicia', type: 'dependency' },
      { id: 'e-apego-tristura', source: 'apego', target: 'tristura', type: 'dependency' },
      { id: 'e-verbo-mais', source: 'verbo', target: 'mais', type: 'path' },
    ],
    metadata: {
      proxecto: 'a-cova',
      principio: 'a cova de Platón — o bebé só percibe o que o coidador proxecta',
    },
  }
}
// ── FIN: a mente semente ──
