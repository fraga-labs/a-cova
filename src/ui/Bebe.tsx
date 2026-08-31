// ── INICIO: o bebé ──
// Arte PLACEHOLDER, declarada como tal: pixel-art xerado dunha grella de
// texto (edítase como un debuxo). O pixel-art fino do mockup vén despois.
//
// As animacións son deliberadamente baratas: respiración e pestanexo do
// bebé, lume que tremela, planta que abanea e o bocadillo que aparece
// dun chimpo. Todo CSS agás o pestanexo, que precisa cambiar de debuxo.
// Con `prefers-reduced-motion` queda todo quieto (ver styles.css).

import type { JSX } from 'react'
import { useEffect, useState } from 'react'

const PALETA: Readonly<Record<string, string>> = {
  '.': 'transparent',
  k: '#2b1d16', // contorno
  p: '#e8b48c', // pel
  o: '#f6dcc4', // brillo
  h: '#8a6a4a', // cornos
  e: '#2b1d16', // ollos
  b: '#e79ab8', // meixelas
  m: '#8a4a4a', // boca
  c: '#7a5a3a', // cueiro
}

/** 16 columnas × 16 filas. Le como un debuxo, edítase como un debuxo. */
const DESPERTO = [
  '................',
  '..h..........h..',
  '..hhkkkkkkkkhh..',
  '...kppppppppk...',
  '...kpoppppopk...',
  '...kpeppppepk...',
  '...kppppppppk...',
  '...kpbppppbpk...',
  '...kpppmmpppk...',
  '....kkkkkkkk....',
  '...pkppppppkp...',
  '....kppppppk....',
  '....kcccccck....',
  '....kcccccck....',
  '.....kk..kk.....',
  '................',
]

/** Mesmo debuxo cos ollos unha fila máis abaixo: le como un pestanexo. */
const PESTANEXO = [
  ...DESPERTO.slice(0, 5),
  '...kppppppppk...',
  '...kpeppppepk...',
  ...DESPERTO.slice(7),
]

/** Ollos pechados en arco e boca pequena: dorme. */
const DURMIDO = [
  ...DESPERTO.slice(0, 5),
  '...kpkppppkpk...',
  '...kppppppppk...',
  '...kpbppppbpk...',
  '...kppppmpppk...',
  ...DESPERTO.slice(9),
]

function Grella({ filas }: { readonly filas: readonly string[] }): JSX.Element {
  const cadros: JSX.Element[] = []
  filas.forEach((fila, y) => {
    ;[...fila].forEach((ch, x) => {
      const cor = PALETA[ch] ?? 'transparent'
      if (cor === 'transparent') {
        return
      }
      cadros.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={cor} />)
    })
  })
  return <g shapeRendering="crispEdges">{cadros}</g>
}

/** Pestanexa cada 3-7 s durante 160 ms. Nada máis. */
function usePestanexo(activo: boolean): boolean {
  const [pechado, setPechado] = useState(false)

  useEffect(() => {
    if (!activo) {
      setPechado(false)
      return
    }
    let seguinte: number
    let peche: number
    const programar = (): void => {
      seguinte = window.setTimeout(() => {
        setPechado(true)
        peche = window.setTimeout(() => {
          setPechado(false)
          programar()
        }, 160)
      }, 3000 + Math.random() * 4000)
    }
    programar()
    return () => {
      window.clearTimeout(seguinte)
      window.clearTimeout(peche)
    }
  }, [activo])

  return pechado
}

export interface BebeProps {
  readonly temCaca: boolean
  readonly durmido: boolean
  readonly triste: boolean
  /** Palabra que acaba de dicir (3/3). */
  readonly di: string | null
}

export function Bebe({ temCaca, durmido, triste, di }: BebeProps): JSX.Element {
  const pechado = usePestanexo(!durmido)
  const bocadillo = di !== null ? di : temCaca ? '💩' : null
  const filas = durmido ? DURMIDO : pechado ? PESTANEXO : DESPERTO
  const texto = descricion(temCaca, durmido, triste, di)

  return (
    <div className={`cova-lenzo${triste ? ' cova-lenzo--triste' : ''}`}>
      <svg viewBox="0 0 32 22" role="img" aria-label={texto}>
        <title>{texto}</title>

        {/* a cova */}
        <rect x={0} y={0} width={32} height={22} fill="#16100d" />
        <path d="M0 22 L0 8 Q6 2 16 3 Q26 2 32 8 L32 22 Z" fill="#241a14" />
        <path d="M0 22 L0 14 Q8 10 16 12 Q24 10 32 14 L32 22 Z" fill="#2f231a" />

        {/* a fogueira, que tremela */}
        <g shapeRendering="crispEdges">
          <rect x={25} y={17} width={4} height={1} fill="#5a3d24" />
          <rect className="chama chama--baixa" x={26} y={15} width={2} height={2} fill="#e08a3c" />
          <rect className="chama chama--alta" x={26} y={14} width={1} height={1} fill="#e8c547" />
          <circle className="lume" cx={27} cy={16} r={5} fill="#e08a3c" opacity={0.08} />
        </g>

        {/* a planta, que abanea */}
        <g className="planta" shapeRendering="crispEdges">
          <rect x={3} y={16} width={1} height={3} fill="#3f6b3a" />
          <rect x={2} y={15} width={1} height={1} fill="#6fbf73" />
          <rect x={4} y={14} width={1} height={1} fill="#6fbf73" />
        </g>

        {/* o bebé, que respira */}
        <g transform="translate(8 4)">
          <g className={`respira${durmido ? ' respira--fonda' : ''}`}>
            <Grella filas={filas} />
            {durmido ? (
              <text className="zzz" x={13} y={3} fontSize={3} fill="#b09a80">
                z
              </text>
            ) : null}
          </g>
        </g>

        {bocadillo !== null ? (
          <g className="bocadillo" key={bocadillo}>
            <rect x={19} y={2} width={10} height={6} rx={1} fill="#f0e6d2" />
            <path d="M20 8 L20 10.5 L22.5 8 Z" fill="#f0e6d2" />
            <text
              x={24}
              y={6.2}
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
