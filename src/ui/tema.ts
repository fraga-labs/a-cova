// ── INICIO: o tema da mente ──
// Sen isto, o `SkillTree` colle o tema `minimal`, que ten `text:
// '#222222'` — texto case negro pensado para fondo claro. Sobre o lenzo
// escuro da cova os nomes dos nodos non se lían.
//
// Partimos de `minimalDark` (que xa asume fondo escuro) e axustamos á
// paleta da casa: pergamiño para o texto, laranxa para o que está no
// máximo, e os locked ben apagados — un nodo que aínda non existe para
// o bebé ten que verse como o que é, unha sombra.

import type { Theme } from '@yggdrasil-forge/react'
import { minimalDark } from '@yggdrasil-forge/react'

export const temaCova: Theme = {
  ...minimalDark,
  colors: {
    ...minimalDark.colors,

    // Pergamiño, o mesmo `--texto` da interface. Contraste amplo contra
    // o lenzo (#0b0806): o que se pediu arranxar.
    text: '#f0e6d2',
    icon: '#f0e6d2',

    // Estados. A lenda do mockup só ten tres: descoñecido, descuberto e
    // máximo — así que son estes tres os que teñen que distinguirse dun
    // golpe de vista.
    nodeLocked: '#2a211b', // descoñecido: apenas está
    nodeUnlockable: '#4a3728',
    nodeUnlocked: '#8a6a4a', // descuberto
    nodeMaxed: '#e08a3c', // máximo: laranxa da casa
    nodeInProgress: '#6b5b8a',

    nodeStroke: '#6b4f38',
    nodeFill: '#1a130f',

    edge: '#3f3229',
    edgeActive: '#8a6a4a',
    mesh: '#241a14',
  },
  sizes: {
    ...minimalDark.sizes,
    // Un chisco máis grande có defecto: os nomes das palabras son
    // curtos e queremos que se lean sen achegar o zoom.
    fontSize: 15,
    fontSizeSmall: 11,
    // Truncado de etiquetas (soporte do propio motor): por riba disto o
    // nodo mostra `N…` e engade un `<title>` co texto completo, que o
    // navegador ensina ao pousar o rato. O `aria-label` conserva sempre
    // o texto enteiro, así que o lector de pantalla non perde nada.
    //
    // Doce porque é o que colle nun nodo sen que as etiquetas se
    // pisen unhas ás outras. Se algún día se quere máis longo, é esta
    // liña e nada máis.
    maxLabelChars: 12,
  },
  typography: {
    fontFamily: "'Cascadia Mono', 'DejaVu Sans Mono', 'Courier New', monospace",
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
}
// ── FIN: o tema da mente ──
