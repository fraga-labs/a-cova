// ── INICIO: o bebé ──
// Arte PLACEHOLDER, declarada como tal: pixel-art xerado dunha grella de
// texto. O pixel-art fino do mockup vén despois; isto existe para que o
// bucle do corpo se poida ver funcionando hoxe.

import type { JSX } from 'react'

const PALETA: Readonly<Record<string, string>> = {
  '.': 'transparent',
  k: '#2b1d16', // contorno
  p: '#e8b48c', // pel
  s: '#c98f6a', // sombra da pel
  o: '#f4d9c0', // brillo
  h: '#8a6a4a', // cornos
  e: '#2b1d16', // ollos
  b: '#e07aa8', // meixelas
  c: '#7a5a3a', // cueiro / tobo
}

/** 16 columnas × 16 filas. Le como un debuxo, edítase como un debuxo. */
const DESPERTO = [
  '................',
  '..h..........h..',
  '..h..kkkkkk..h..',
  '..hhkppppppkhh..',
  '...kpoppppopk...',
  '...kpepppepk....',
  '...kppppppppk...',
  '...kpbppppbpk...',
  '....kpppppppk...',
  '.....kkppkk.....',
  '....kppppppk....',
  '...kppppppppk...',
  '...kpccccccpk...',
  '...kkccccccKk...',
  '....k.cccc.k....',
  '.....kk..kk.....',
]

const DURMIDO = [
  '................',
  '..h..........h..',
  '..h..kkkkkk..h..',
  '..hhkppppppkhh..',
  '...kpoppppopk...',
  '...kpkppppkpk...',
  '...kppppppppk...',
  '...kpbppppbpk...',
  '....kpppppppk...',
  '.....kkppkk.....',
  '....kppppppk....',
  '...kppppppppk...',
  '...kpccccccpk...',
  '...kkccccccKk...',
  '....k.cccc.k....',
  '.....kk..kk.....',
]

function Grella({ filas }: { readonly filas: readonly string[] }): JSX.Element {
  const cadros: JSX.Element[] = []
  filas.forEach((fila, y) => {
    ;[...fila].forEach((ch, x) => {
      const cor = PALETA[ch.toLowerCase()] ?? 'transparent'
      if (cor === 'transparent') {
        return
      }
      cadros.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={cor} />)
    })
  })
  return <g shapeRendering="crispEdges">{cadros}</g>
}

export interface BebeProps {
  readonly temCaca: boolean
  readonly durmido: boolean
  readonly triste: boolean
  /** Palabra que acaba de dicir (3/3). */
  readonly di: string | null
}

export function Bebe({ temCaca, durmido, triste, di }: BebeProps): JSX.Element {
  const bocadillo = di !== null ? di : temCaca ? '💩' : null

  return (
    <div className={`cova-lenzo${triste ? ' cova-lenzo--triste' : ''}`}>
      <svg viewBox="0 0 32 22" role="img" aria-label={descricion(temCaca, durmido, triste, di)}>
        <title>{descricion(temCaca, durmido, triste, di)}</title>

        {/* a cova */}
        <rect x={0} y={0} width={32} height={22} fill="#16100d" />
        <path d="M0 22 L0 8 Q6 2 16 3 Q26 2 32 8 L32 22 Z" fill="#241a14" />
        <path d="M0 22 L0 14 Q8 10 16 12 Q24 10 32 14 L32 22 Z" fill="#2f231a" />

        {/* a fogueira */}
        <g shapeRendering="crispEdges">
          <rect x={25} y={17} width={4} height={1} fill="#5a3d24" />
          <rect x={26} y={15} width={2} height={2} fill="#e08a3c" />
          <rect x={26} y={14} width={1} height={1} fill="#e8c547" />
        </g>

        {/* a planta */}
        <g shapeRendering="crispEdges">
          <rect x={3} y={16} width={1} height={3} fill="#3f6b3a" />
          <rect x={2} y={15} width={1} height={1} fill="#6fbf73" />
          <rect x={4} y={14} width={1} height={1} fill="#6fbf73" />
        </g>

        {/* o tobo + o bebé */}
        <g transform="translate(8 4) scale(1)">
          <Grella filas={durmido ? DURMIDO : DESPERTO} />
        </g>

        {bocadillo !== null ? (
          <g>
            <rect x={19} y={3} width={9} height={6} rx={1} fill="#f0e6d2" />
            <path d="M20 9 L20 11 L22.5 9 Z" fill="#f0e6d2" />
            <text
              x={23.5}
              y={7.2}
              textAnchor="middle"
              fontSize={bocadillo.length > 2 ? 2.6 : 4}
              fill="#2b1d16"
              fontFamily="inherit"
            >
              {bocadillo}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  )
}

function descricion(temCaca: boolean, durmido: boolean, triste: boolean, di: string | null): string {
  if (di !== null) {
    return `O bebé di «${di}»`
  }
  if (temCaca) {
    return 'O bebé acaba de facer caca'
  }
  if (durmido) {
    return 'O bebé está a durmir'
  }
  if (triste) {
    return 'O bebé chora'
  }
  return 'O bebé está tranquilo na cova'
}
// ── FIN: o bebé ──
