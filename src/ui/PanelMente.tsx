// ── INICIO: o panel da mente ──
// Columna dereita: o SkillTree EN VIVO. Non é unha ilustración da mente:
// é a mente. O mesmo documento que se exporta e se abre no editor.

import { resolveLocalized } from '@yggdrasil-forge/common'
import { SkillTree, type SkillTreeHandle, ThemeProvider } from '@yggdrasil-forge/react'
import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { COR_REXION, ETIQUETA_REXION, REXIONS, type RexionId } from '../cova/mente-semente.js'
import type { Cova } from '../cova/useCova.js'
import { temaCova } from './tema.js'

const ORDE_REXIONS: readonly RexionId[] = [
  REXIONS.corpo,
  REXIONS.sons,
  REXIONS.linguaxe,
  REXIONS.afectos,
  REXIONS.conceptos,
  REXIONS.memorias,
  REXIONS.sombra,
]

export function PanelMente({ cova }: { readonly cova: Cova }): JSX.Element {
  const arbore = useRef<SkillTreeHandle>(null)
  const [zoom, setZoom] = useState(100)
  const [agochadas, setAgochadas] = useState<readonly RexionId[]>([])

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
      arbore.current?.fit()
      setZoom(Math.round((arbore.current?.getZoom() ?? 1) * 100))
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

      <div className="mente__lenzo">
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
        <div className="zoom">
          <button type="button" onClick={() => { arbore.current?.zoomOut(); setZoom(Math.round((arbore.current?.getZoom() ?? 1) * 100)) }}>
            −
          </button>
          <button type="button" onClick={() => { arbore.current?.fit(); setZoom(Math.round((arbore.current?.getZoom() ?? 1) * 100)) }}>
            {zoom}%
          </button>
          <button type="button" onClick={() => { arbore.current?.zoomIn(); setZoom(Math.round((arbore.current?.getZoom() ?? 1) * 100)) }}>
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
      <button type="button" className="detalle__pechar" onClick={() => { cova.seleccionar(null) }}>
        pechar
      </button>
    </aside>
  )
}

// ── FIN: o panel da mente ──
