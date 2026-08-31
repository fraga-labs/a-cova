// ── INICIO: o bebé ──
// Arte PLACEHOLDER, declarada como tal: pixel-art xerado dunha grella de
// texto. O pixel-art fino do mockup vén despois.
//
// A cara NON se debuxa enteira por cada estado de ánimo: iso serían oito
// grellas case idénticas e imposibles de manter aliñadas. Hai un corpo
// base con dous ocos —a fila dos ollos e a fila da boca— e cada
// expresión enche eses dous ocos. Engadir unha cara nova é escribir dúas
// liñas de texto.

import type { JSX } from 'react'
import { useEffect, useState } from 'react'

const PALETA: Readonly<Record<string, string>> = {
  '.': 'transparent',
  k: '#2b1d16', // contorno
  p: '#e8b48c', // pel
  o: '#f6dcc4', // brillo
  h: '#8a6a4a', // cornos
  e: '#2b1d16', // ollos
  w: '#fdfdfd', // brillo do ollo
  b: '#e79ab8', // meixelas
  m: '#8a4a4a', // boca
  d: '#6b5b50', // ollo apagado
  r: '#c94a4a', // lingua
  a: '#7fc4e8', // bágoa
  c: '#7a5a3a', // cueiro
}

/**
 * Corpo base, 16×16. Catro ocos que enche a expresión:
 *   `1` `2` as dúas filas dos ollos · `3` `4` as dúas filas da boca.
 *
 * Ollos e boca ocupan DÚAS filas cada un a propósito. Cunha soa, a cara
 * quedaba de vaca de Minecraft: os ollos non tiñan mirada e o sorriso
 * líase como un buraco rectangular. Con dúas, a boca pode curvarse
 * (comisuras arriba = sorriso, abaixo = pena) e o ollo ten pupila e
 * brillo. A cabeza leva as esquinas recortadas para non ser un caixón.
 */
const CORPO = [
  '................',
  '..h..........h..',
  '..hhkkkkkkkkhh..',
  '...kppppppppk...',
  '...1111111111...',
  '...2222222222...',
  '...kppppppppk...',
  '...3333333333...',
  '...4444444444...',
  '....kkkkkkkk....',
  '...pkppppppkp...',
  '....kpoooopk....',
  '....kppppppk....',
  '....kpccccpk....',
  '....kcccccck....',
  '.....kk..kk.....',
]

export type Expresion =
  | 'tranquilo'
  | 'contento'
  | 'triste'
  | 'famento'
  | 'durmido'
  | 'falando'
  | 'apagado'
  | 'pestanexo'

// As catro filas variables. Sempre 10 caracteres: o 0 e o 9 son o
// contorno da cabeza, e os oito do medio son o oco.
//
//   índice  0 1 2 3 4 5 6 7 8 9
//           k . O O . . O O . k     ← ollos no 2-3 e no 6-7
//           k b . m m m m . b k     ← boca no 3..6, meixelas no 1 e 8
//
// Se algunha fila non mide 10, `normalizar` córtaa: mellor unha cara
// rara ca un debuxo torto.

/** Fila de ARRIBA dos ollos. */
const OLLOS_ARRIBA: Record<Expresion, string> = {
  tranquilo: 'kpewppewpk', // pupila + brillo arriba á dereita
  contento: 'kppppppppk', // pechados de gusto
  triste: 'kppppppppk', // caídos: só ocupan a fila de abaixo
  famento: 'kpewppewpk',
  durmido: 'kppppppppk',
  falando: 'kpewppewpk',
  apagado: 'kppppppppk',
  pestanexo: 'kppppppppk',
}

/** Fila de ABAIXO dos ollos. */
const OLLOS_ABAIXO: Record<Expresion, string> = {
  tranquilo: 'kpeeppeepk',
  contento: 'kpkkppkkpk', // dúas raias: os ollos apertados de rir
  triste: 'kpeeppeepk',
  famento: 'kpeeppeepk',
  durmido: 'kpkkppkkpk',
  falando: 'kpeeppeepk',
  apagado: 'kpddppddpk', // sen brillo ningún
  pestanexo: 'kpkkppkkpk',
}

/** Fila de ARRIBA da boca: aquí van as comisuras e as meixelas. */
const BOCAS_ARRIBA: Record<Expresion, string> = {
  tranquilo: 'kppppppppk',
  contento: 'kbpmppmpbk', // comisuras arriba → sorriso
  triste: 'kpppmmpppk', // centro arriba → pena
  famento: 'kppmrrmppk',
  durmido: 'kppppppppk',
  falando: 'kbpmrrmpbk',
  apagado: 'kppmmmmppk', // unha raia recta. Nin sorriso nin pena.
  pestanexo: 'kppppppppk',
}

/** Fila de ABAIXO da boca. */
const BOCAS_ABAIXO: Record<Expresion, string> = {
  tranquilo: 'kpppmmpppk',
  contento: 'kppmmmmppk',
  triste: 'kppmppmppk', // comisuras abaixo
  famento: 'kppmmmmppk',
  durmido: 'kppppmpppk',
  falando: 'kppmmmmppk',
  apagado: 'kppppppppk',
  pestanexo: 'kpppmmpppk',
}

/** Bágoas: só chora quen aínda espera que veñas. */
const CHORA: ReadonlySet<Expresion> = new Set<Expresion>(['triste'])

function filas(expresion: Expresion): readonly string[] {
  const ocos: Record<string, string> = {
    '1111111111': normalizar(OLLOS_ARRIBA[expresion]),
    '2222222222': normalizar(OLLOS_ABAIXO[expresion]),
    '3333333333': normalizar(BOCAS_ARRIBA[expresion]),
    '4444444444': normalizar(BOCAS_ABAIXO[expresion]),
  }
  return CORPO.map((fila) => {
    const oco = Object.keys(ocos).find((k) => fila.includes(k))
    return oco === undefined ? fila : fila.replace(oco, ocos[oco] ?? '')
  })
}

/** Garante 10 caracteres exactos: unha expresión mal medida non desprace o debuxo. */
function normalizar(fila: string): string {
  return fila.length === 10 ? fila : fila.slice(0, 10).padEnd(10, 'p')
}

function Grella({ filas: grella }: { readonly filas: readonly string[] }): JSX.Element {
  const cadros: JSX.Element[] = []
  grella.forEach((fila, y) => {
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
      seguinte = window.setTimeout(
        () => {
          setPechado(true)
          peche = window.setTimeout(() => {
            setPechado(false)
            programar()
          }, 160)
        },
        3000 + Math.random() * 4000,
      )
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
  readonly expresion: Expresion
  readonly temCaca: boolean
  /** Palabra que acaba de dicir (3/3). */
  readonly di: string | null
}

export function Bebe({ expresion, temCaca, di }: BebeProps): JSX.Element {
  const durmido = expresion === 'durmido'
  const pechado = usePestanexo(!durmido && expresion !== 'apagado')
  const cara = pechado ? 'pestanexo' : expresion
  const bocadillo = di !== null ? di : temCaca ? '💩' : null
  const texto = DESCRICIONS[expresion]

  return (
    <div className={`cova-lenzo cova-lenzo--${expresion}`}>
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

        {/* o bebé */}
        <g transform="translate(8 4)">
          <g className={claseAnimacion(expresion)}>
            <Grella filas={filas(cara)} />

            {CHORA.has(expresion) ? (
              <g shapeRendering="crispEdges">
                <rect className="bagoa bagoa--esquerda" x={5} y={6} width={1} height={1} fill={PALETA.a} />
                <rect className="bagoa bagoa--dereita" x={10} y={6} width={1} height={1} fill={PALETA.a} />
              </g>
            ) : null}

            {expresion === 'contento' ? (
              <g className="chispas" shapeRendering="crispEdges">
                <rect x={1} y={3} width={1} height={1} fill="#e8c547" />
                <rect x={14} y={4} width={1} height={1} fill="#e8c547" />
              </g>
            ) : null}

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

/** Cada ánimo móvese ao seu ritmo. Un bebé apagado non fai o mesmo ca un contento. */
function claseAnimacion(expresion: Expresion): string {
  switch (expresion) {
    case 'durmido':
      return 'respira respira--fonda'
    case 'contento':
    case 'falando':
      return 'respira brinca'
    case 'apagado':
      return 'respira respira--fonda'
    default:
      return 'respira'
  }
}

const DESCRICIONS: Record<Expresion, string> = {
  tranquilo: 'O bebé está tranquilo na cova',
  contento: 'O bebé está contento',
  triste: 'O bebé chora',
  famento: 'O bebé ten fame',
  durmido: 'O bebé está a durmir',
  falando: 'O bebé está a falar',
  apagado: 'O bebé está incómodo e non chora',
  pestanexo: 'O bebé pestanexa',
}
// ── FIN: o bebé ──
