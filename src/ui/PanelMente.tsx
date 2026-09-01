// ── INICIO: o panel da mente ──
// Columna dereita: o SkillTree EN VIVO. Non é unha ilustración da mente:
// é a mente. O mesmo documento que se exporta e se abre no editor.

import { resolveLocalized } from '@yggdrasil-forge/common'
import { SkillTree, type SkillTreeHandle, ThemeProvider } from '@yggdrasil-forge/react'
import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { segmentar } from '../cova/fonoloxia.js'
import { comprensionDe, sonsDominados } from '../cova/linguaxe.js'
import { COR_REXION, ETIQUETA_REXION, PREFIXO, REXIONS, type RexionId } from '../cova/mente-semente.js'
import type { Cova } from '../cova/useCova.js'
import { temaCova } from './tema.js'

/**
 * Con douscentas palabras non hai layout que valla: ler douscentas
 * etiquetas á vez é imposible. O filtro non agocha os nodos —
 * esvaéceos—, así que segues vendo o tamaño da mente pero les só o
 * que che interesa.
 */
type Filtro = 'todas' | 'intenta' | 'di'

/** Canto texto se amosa, segundo o preto que esteas. */
type Detalle = 'baixo' | 'medio' | 'alto'

/** Tamaño da fonte das etiquetas, en unidades do layout (ver `tema.ts`). */
const FONTE = 15

/** Por baixo disto (píxeles de pantalla) a etiqueta é unha mancha. */
const LEXIBLE = 6

/**
 * A onde se apunta ao achegarse. Un píxel por riba do limiar e non
 * xusto nel: medido no teléfono, pedir os 6 exactos deixaba o texto en
 * 5,96 —o renderer cuantiza o zoom— e seguía sen amosarse.
 */
const OBXECTIVO = LEXIBLE + 1

/**
 * Canto se pode achegar o encadre inicial antes de deixar de ver a mente
 * enteira. Isto é o que distingue «o panel é estreito de máis» de «a
 * mente é grande de máis»: no primeiro caso chega un empuxón, no segundo
 * non hai zoom que chegue e é mellor ver o conxunto.
 */
const ACHEGA_MAXIMA = 2

/**
 * Píxeles de pantalla por unidade de layout, ao zoom 1.
 *
 * O zoom é relativo ao `viewBox`, e o `viewBox` medra coa mente: con
 * douscentas palabras mide 4181 unidades para 754 píxeles de panel. De
 * aí que o zoom por si só non diga nada sobre se algo se le.
 */
function escalaDoLenzo(contedor: HTMLElement | null): number | null {
  const svg = contedor?.querySelector('svg')
  if (svg === null || svg === undefined) {
    return null
  }
  const ancho = svg.viewBox.baseVal.width
  const pixeis = svg.getBoundingClientRect().width
  if (ancho <= 0 || pixeis <= 0) {
    return null
  }
  return pixeis / ancho
}

/**
 * O nivel de detalle NON pode saír do zoom: ao 100 % unha mente de
 * douscentas palabras renderiza a etiqueta a **2,7 px**. O que hai que
 * medir é o tamaño REAL do texto na pantalla.
 */
function medirDetalle(contedor: HTMLElement | null, zoom: number): Detalle {
  const escala = escalaDoLenzo(contedor)
  if (escala === null) {
    return 'alto'
  }
  const fontePx = FONTE * escala * zoom
  if (fontePx < LEXIBLE) {
    return 'baixo'
  }
  return fontePx < 10 ? 'medio' : 'alto'
}

/**
 * A decisión soa, sen DOM: dada a escala do lenzo e o zoom ao que quedou
 * o encadre, a que zoom hai que ir — ou `null` se non hai que moverse.
 */
export function zoomLexible(escala: number, actual: number): number | null {
  const preciso = OBXECTIVO / (FONTE * escala)
  if (preciso <= actual || preciso > actual * ACHEGA_MAXIMA) {
    return null
  }
  return preciso
}

/**
 * Encadrar todo é o correcto nun panel ancho e é un erro nun estreito.
 * Medido nun teléfono de 375 px: o lenzo queda en 331 e unha mente de
 * vinte nodos —que no escritorio se le de sobra— sae a **5 px** de
 * fonte, é dicir, unha constelación de puntos sen unha soa palabra.
 *
 * Así que encadramos, calculamos o zoom exacto ao que a etiqueta chega
 * ao mínimo lexible e, se é pouco máis do que xa hai, achegámonos ata
 * alí centrados no «eu». Se fai falta moito máis, non se toca: iso xa
 * non é un panel estreito, é unha mente grande, e a vista do conxunto
 * vale máis ca unha lupa.
 */
function encadrarLexible(arbore: SkillTreeHandle | null, contedor: HTMLElement | null): void {
  if (arbore === null) {
    return
  }
  arbore.fit()
  const escala = escalaDoLenzo(contedor)
  if (escala === null) {
    return
  }
  const desexado = zoomLexible(escala, arbore.getZoom())
  if (desexado === null) {
    return
  }
  arbore.centerOn('eu', { zoom: desexado })
}

const ORDE_REXIONS: readonly RexionId[] = [
  REXIONS.corpo,
  REXIONS.mundo,
  REXIONS.sons,
  REXIONS.linguaxe,
  REXIONS.afectos,
  REXIONS.conceptos,
  REXIONS.memorias,
  REXIONS.sombra,
]

export function PanelMente({ cova }: { readonly cova: Cova }): JSX.Element {
  const arbore = useRef<SkillTreeHandle>(null)
  const lenzo = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(100)
  const [agochadas, setAgochadas] = useState<readonly RexionId[]>([])
  const [filtro, setFiltro] = useState<Filtro>('todas')

  // Nivel de detalle, coma nun mapa. Con douscentas palabras, ler todas
  // as etiquetas á vez é imposible por moito que non se pisen: a esa
  // escala son manchas. Así que de lonxe só se ven as que xa di, e o
  // resto aparece a medida que te achegas.
  const [detalle, setDetalle] = useState<Detalle>('medio')

  // As rexións que EXISTEN no documento, non as que imaxinamos: a SOMBRA
  // só aparece se o bebé chegou a aprender algo da ausencia. Un bebé ben
  // coidado nunca ve ese chip.
  const rexions = useMemo(() => {
    const declaradas = new Set((cova.engine.getTreeDef().groups ?? []).map((g) => g.id))
    return ORDE_REXIONS.filter((r) => declaradas.has(r))
  }, [cova.engine, cova.acontecementos])

  const rexionsVisibles = useMemo(
    () => rexions.filter((r) => !agochadas.includes(r)),
    [rexions, agochadas],
  )

  const regions = useMemo(
    () =>
      rexionsVisibles.map((r) => ({
        id: r,
        label: ETIQUETA_REXION[r],
        tag: r,
        color: COR_REXION[r],
      })),
    [rexionsVisibles],
  )

  // Encadrar tras o primeiro paint: o grafo medra, e o coidador non ten
  // por que perseguilo.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      encadrarLexible(arbore.current, lenzo.current)
      const z = arbore.current?.getZoom() ?? 1
      setZoom(Math.round(z * 100))
      setDetalle(medirDetalle(lenzo.current, z))
    })
    return () => {
      cancelAnimationFrame(id)
    }
  }, [])

  const conta = contarNodos(cova)

  return (
    <section className="panel panel--mente" aria-label="A mente do bebé">
      <header className="mente__cabeceira">
        <h2 className="titulo">A MENTE DO BEBÉ</h2>
        <span className="mente__conta">
          {conta.acesos}/{conta.total} nodos acesos
        </span>
      </header>

      <div className="chips" role="group" aria-label="Rexións da mente">
        {rexions.map((r) => {
          const activa = rexionsVisibles.includes(r)
          return (
            <button
              key={r}
              type="button"
              className={`chip${activa ? ' chip--activa' : ''}`}
              style={{ borderColor: COR_REXION[r], color: activa ? '#16100d' : COR_REXION[r], background: activa ? COR_REXION[r] : 'transparent' }}
              aria-pressed={activa}
              onClick={() => {
                setAgochadas((v) => (v.includes(r) ? v.filter((x) => x !== r) : [...v, r]))
              }}
            >
              {ETIQUETA_REXION[r]}
            </button>
          )
        })}
      </div>

      <UltimoAceso cova={cova} />

      <div className="mente__lenzo" ref={lenzo} data-filtro={filtro} data-detalle={detalle}>
        {/* O ThemeProvider ten que envolver o SkillTree: o wrapper por
            defecto respecta un tema ascendente e só impón `minimal`
            (pensado para fondo claro) se non hai ningún. */}
        <ThemeProvider theme={temaCova}>
          <SkillTree
            ref={arbore}
            engine={cova.engine}
            locale="gl"
            regions={regions}
            regionShape="hull"
            {...(cova.seleccionado !== null && { selectedNodeId: cova.seleccionado })}
            onNodeClick={(id) => {
              cova.seleccionar(id === cova.seleccionado ? null : id)
            }}
            showTierBadge
            padding={28}
            // O tope de 4× do renderer queda curto cando a mente é
            // grande: o `viewBox` medra con ela, así que ao 400 % a
            // etiqueta aínda estaba a 10,8 px. Con 12× pódese chegar a
            // ler unha palabra concreta entre douscentas.
            maxZoom={12}
            onViewportChange={(v) => {
              setDetalle(medirDetalle(lenzo.current, v.zoom))
              setZoom(Math.round(v.zoom * 100))
            }}
          />
        </ThemeProvider>
      </div>

      <footer className="mente__pe">
        <ul className="lenda">
          <li>
            <span className="lenda__mostra lenda__mostra--descoñecido" /> descoñecido
          </li>
          <li>
            <span className="lenda__mostra lenda__mostra--descuberto" /> descuberto
          </li>
          <li>
            <span className="lenda__mostra lenda__mostra--maximo" /> máximo
          </li>
        </ul>
        <label className="filtro">
          <span className="visualmente-oculto">Que palabras amosar</span>
          <select
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value as Filtro)
            }}
          >
            <option value="todas">todas as palabras</option>
            <option value="intenta">só as que intenta dicir</option>
            <option value="di">só as que di ben</option>
          </select>
        </label>
        <div className="zoom">
          {/* O indicador sae SÓ de `onViewportChange`: actualizalo tamén
              aquí daba dous valores distintos (o botón dicía 207 % cando
              o viewport ía por 1200 %). */}
          <button type="button" title="afastar" onClick={() => arbore.current?.zoomOut()}>
            −
          </button>
          <button type="button" title="encadrar todo" onClick={() => arbore.current?.fit()}>
            {zoom}%
          </button>
          <button type="button" title="achegar" onClick={() => arbore.current?.zoomIn()}>
            +
          </button>
        </div>
      </footer>

      <Detalle cova={cova} />
    </section>
  )
}

/**
 * Fai latexar o nodo do último acontecemento. O `<g>` de cada nodo xa leva
 * o seu `transform` do layout, así que a animación só toca opacidade e
 * sombra — nunca `transform`, que movería o nodo do seu sitio.
 *
 * A `key` é o id do acontecemento: ao cambiar, o `<style>` desmóntase e
 * vólvese montar, e a animación arranca de novo. Sen `key` só se vería a
 * primeira vez.
 */
function UltimoAceso({ cova }: { readonly cova: Cova }): JSX.Element | null {
  const ultimo = cova.acontecementos[0]
  if (ultimo?.nodeId === undefined) {
    return null
  }
  const selector = `.mente__lenzo .yf-skill-node[data-node-id="${cssEscape(ultimo.nodeId)}"]`
  return (
    <style key={ultimo.id}>{`${selector} { animation: nacer 800ms ease-out 2; }`}</style>
  )
}

/** Escapa comiñas e barras nun id que vai dentro dun selector CSS. */
function cssEscape(id: string): string {
  return id.replace(/["\\]/g, '\\$&')
}

function contarNodos(cova: Cova): { total: number; acesos: number } {
  const nodos = cova.engine.getTreeDef().nodes
  let acesos = 0
  for (const n of nodos) {
    const s = cova.engine.getNodeState(n.id)?.state
    if (s === 'unlocked' || s === 'maxed') {
      acesos += 1
    }
  }
  return { total: nodos.length, acesos }
}

function Detalle({ cova }: { readonly cova: Cova }): JSX.Element | null {
  const id = cova.seleccionado
  if (id === null) {
    return null
  }
  const def = cova.engine.getTreeDef().nodes.find((n) => n.id === id)
  if (def === undefined) {
    return null
  }
  const inst = cova.engine.getNodeState(id)
  const etiqueta = resolveLocalized(def.label, 'gl')
  const descricion =
    def.description === undefined ? null : resolveLocalized(def.description, 'gl')

  return (
    <aside className="detalle">
      <strong>{etiqueta}</strong>
      <span className="detalle__estado">
        {inst?.state ?? 'locked'}
        {def.maxTier !== undefined ? ` · ${inst?.currentTier ?? 0}/${def.maxTier}` : ''}
      </span>
      {descricion !== null ? <p>{descricion}</p> : null}
      <Palabra cova={cova} nodeId={id} />
      <button type="button" className="detalle__pechar" onClick={() => { cova.seleccionar(null) }}>
        pechar
      </button>
    </aside>
  )
}

/**
 * O detalle dunha PALABRA. Isto é o que faltaba para poder aprender a
 * xogar: ver por que lle sae «aua» e non «auga». Sen dicilo, o coidador
 * repite a palabra sen saber que o que falta non é comprensión, é o /g/.
 */
function Palabra({ cova, nodeId }: { readonly cova: Cova; readonly nodeId: string }): JSX.Element | null {
  if (!nodeId.startsWith(PREFIXO.palabra)) {
    return null
  }
  const palabra = nodeId.slice(PREFIXO.palabra.length)
  const comprension = Math.round(comprensionDe(cova.politica.familiaridade, palabra))
  const dominados = sonsDominados(cova.engine)
  const sons = [...new Set(segmentar(palabra))]
  const faltan = sons.filter((x) => !dominados.has(x))

  return (
    <div className="detalle__palabra">
      <span className="detalle__liña">
        entende <strong>{comprension}%</strong>
      </span>
      <span className="detalle__sons">
        {sons.map((x) => (
          <span key={x} className={`son${dominados.has(x) ? ' son--ten' : ''}`}>
            {x}
          </span>
        ))}
      </span>
      {faltan.length > 0 ? (
        <span className="detalle__liña detalle__liña--falta">
          Fáltanlle os sons {faltan.map((x) => `/${x}/`).join(' ')} — por iso non lle sae enteira.
        </span>
      ) : (
        <span className="detalle__liña">Xa ten todos os sons desta palabra.</span>
      )}
    </div>
  )
}
// ── FIN: o panel da mente ──
