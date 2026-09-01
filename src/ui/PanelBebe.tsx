// ── INICIO: o panel do bebé ──
// Columna esquerda do mockup: estado, o bebé, a alerta, as accións e a
// ensinanza cos tres tiers á vista.

import type { JSX } from 'react'
import { useState } from 'react'
import { DRIVE_SPECS, LIMIAR_LEDICIA, LIMIAR_SUCIDADE } from '../cova/drives.js'
import { ESTIMULOS } from '../cova/lexico.js'
import { comoDi } from '../cova/fonoloxia.js'
import {
  LIMIARES_PALABRA,
  comprensionDe,
  idPalabra,
  palabrasEnCurso,
  sonsDominados,
} from '../cova/linguaxe.js'
import { sombrasAcesas } from '../cova/sombras.js'
import { ACCIONS, type Cova } from '../cova/useCova.js'
import { Bebe, type Expresion } from './Bebe.js'
import { Guia } from './Guia.js'

/** Os tres chanzos de PRODUCIÓN. A comprensión vai aparte, e vai por diante. */
const TIERS = [
  { n: 1, etiqueta: 'INTÉNTAO', cor: '#a97ae0' },
  { n: 2, etiqueta: 'RECOÑÉCESE', cor: '#e8c547' },
  { n: 3, etiqueta: 'DIO BEN!', cor: '#6fbf73' },
] as const

export function PanelBebe({ cova }: { readonly cova: Cova }): JSX.Element {
  const [borrador, setBorrador] = useState('')
  const [ultima, setUltima] = useState<string | null>(null)

  const sucidade = cova.drives.sucidade ?? 0
  const temCaca =
    cova.engine.getNodeState('caca')?.state === 'unlocked' ||
    cova.engine.getNodeState('caca')?.state === 'maxed'
  const temMalestar = cova.engine.getNodeState('malestar')?.state === 'unlocked'

  const palabraAmostra = ultima ?? cova.politica.ditas.at(-1) ?? null

  const estimulo = ESTIMULOS[cova.politica.atencion.referente ?? 'nada']
  const sombras = sombrasAcesas(cova.engine)

  const enCurso = palabrasEnCurso(
    cova.engine,
    cova.politica.familiaridade,
    cova.politica.recentes,
  )
  const nodoAmostra = palabraAmostra === null ? null : idPalabra(palabraAmostra)
  const comprension = Math.round(
    palabraAmostra === null ? 0 : comprensionDe(cova.politica.familiaridade, palabraAmostra),
  )
  const producion =
    nodoAmostra === null ? 0 : (cova.engine.getNodeState(nodoAmostra)?.currentTier ?? 0)
  const formaActual =
    palabraAmostra === null ? '' : comoDi(palabraAmostra, sonsDominados(cova.engine))

  function ensinar(): void {
    const p = borrador.trim()
    if (p === '') {
      return
    }
    cova.ensinar(p)
    setUltima(p)
    setBorrador('')
  }

  return (
    <section className="panel panel--bebe" aria-label="O bebé">
      {/* Vai enriba de todo a propósito: é o primeiro que hai que ler, e
          desaparece para sempre en canto o bucle se entende. */}
      <Guia cova={cova} />

      <h2 className="titulo">ESTADO DO BEBÉ</h2>
      <ul className="drives">
        {DRIVE_SPECS.map((d) => {
          const valor = Math.round(cova.drives[d.id] ?? 0)
          const alarma = d.altoEMalo ? valor >= 70 : valor <= 25
          return (
            <li key={d.id} className={`drive${alarma ? ' drive--alarma' : ''}`}>
              <span className="drive__icona" aria-hidden="true">
                {d.icona}
              </span>
              <span className="drive__nome">{d.etiqueta}</span>
              <span className="drive__barra">
                <span
                  className="drive__cheo"
                  style={{ width: `${valor}%`, background: d.cor }}
                  role="progressbar"
                  aria-valuenow={valor}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={d.etiqueta}
                />
              </span>
              <span className="drive__valor">{valor}</span>
            </li>
          )
        })}
      </ul>

      <Bebe expresion={expresion(cova, temMalestar)} temCaca={temCaca} di={cova.di} />

      {temCaca ? (
        <p className="alerta" role="status">
          CACA! Debes limpar ao bebé.
          {sucidade >= LIMIAR_SUCIDADE ? ' A sucidade está alta!' : ''}
        </p>
      ) : null}
      {temMalestar ? (
        <p className="alerta alerta--forte" role="status">
          {cova.mods.cala
            ? 'Está incómodo e non chora. Deixou de agardar que veñas.'
            : 'Chora. Leva demasiado tempo sucio e o apego vai baixando.'}
        </p>
      ) : null}

      {sombras.length > 0 ? (
        <ul className="sombras" aria-label="O que aprendeu da ausencia">
          {sombras.map((s) => (
            <li key={s.id}>
              <span aria-hidden="true">{s.icona}</span> {s.aviso}
            </li>
          ))}
        </ul>
      ) : null}

      <h2 className="titulo">QUE QUERES FACER?</h2>
      <div className="accions">
        {ACCIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            className="accion"
            disabled={cova.ocupado}
            onClick={() => {
              cova.facer(a.id)
            }}
          >
            <span aria-hidden="true">{a.icona}</span>
            <span>{a.etiqueta}</span>
          </button>
        ))}
      </div>

      <h2 className="titulo">
        ENSINANDO{palabraAmostra !== null ? `: ${palabraAmostra.toUpperCase()}` : ''}
      </h2>

      <p className="contexto">
        Agora mesmo <strong>{estimulo.descricion}</strong>.
        {cova.politica.atencion.referente === null ? (
          ' Sen atención só oe os sons; non aprende que significan.'
        ) : (
          <>
            {' '}
            O que lle ensines <em>agora</em> queda ligado a iso. Por exemplo:{' '}
            {estimulo.palabras.slice(0, 3).join(' · ')}
          </>
        )}
      </p>

      {/* A ATENCIÓN, que decae. Non é un temporizador de todo-ou-nada:
          canto máis chea estea, máis lle ensina cada palabra. */}
      <span className="contexto__reloxo" aria-hidden="true">
        <span
          className="contexto__queda"
          style={{ width: `${cova.politica.atencion.forza}%` }}
        />
      </span>

      <div className="ensinar">
        <label className="visualmente-oculto" htmlFor="palabra">
          Palabra que lle queres ensinar
        </label>
        <input
          id="palabra"
          type="text"
          value={borrador}
          placeholder="escribe unha palabra…"
          maxLength={24}
          onChange={(e) => {
            setBorrador(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              ensinar()
            }
          }}
        />
        <button type="button" className="accion accion--ensinar" disabled={cova.ocupado} onClick={ensinar}>
          <span aria-hidden="true">💬</span> ENSINAR PALABRA
        </button>
      </div>

      {/* Repetir cun clic. A repetición é o corazón do xogo e ata agora
          custaba reescribir a palabra enteira cada vez. */}
      {enCurso.length > 0 ? (
        <div className="fichas" role="group" aria-label="Repetir unha palabra">
          {enCurso.map((p) => (
            <button
              key={p.nodeId}
              type="button"
              className={`ficha ficha--${p.producion}`}
              disabled={cova.ocupado}
              title={`entende ${p.comprension}% · ${
                p.producion >= 3 ? 'dío ben' : p.forma === '' ? 'aínda non lle sae' : `sáelle «${p.forma}»`
              }`}
              onClick={() => {
                cova.ensinar(p.palabra)
                setUltima(p.palabra)
              }}
            >
              {p.palabra}
              <span className="ficha__barra" aria-hidden="true">
                <span className="ficha__cheo" style={{ width: `${p.comprension}%` }} />
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="aprendizaxe">
        <div className="aprendizaxe__fila">
          <span className="aprendizaxe__nome">ENTENDE</span>
          <span className="tier__barra">
            <span
              className="tier__cheo"
              style={{ width: `${comprension}%`, background: '#5aa9e0' }}
            />
          </span>
          <span className="aprendizaxe__valor">{comprension}%</span>
        </div>

        <ul className="tiers">
          {TIERS.map((t) => (
            <li key={t.n} className={`tier${producion >= t.n ? ' tier--feito' : ''}`}>
              <span className="tier__n">{t.n}/3</span>
              <span className="tier__barra">
                <span
                  className="tier__cheo"
                  style={{ width: producion >= t.n ? '100%' : '0%', background: t.cor }}
                />
              </span>
              <span className="tier__etiqueta">
                {t.etiqueta}
                {t.n === 3 && producion >= 3 ? (
                  <>
                    {' '}
                    <span className="tier__estrela" key={palabraAmostra ?? ''}>
                      ★
                    </span>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        {palabraAmostra !== null ? (
          <p className="aprendizaxe__saida">
            {producion === 0
              ? comprension >= LIMIARES_PALABRA[0]
                ? 'Enténdeo, pero aínda non lle sae.'
                : 'Aínda non sabe que significa.'
              : formaActual === palabraAmostra
                ? `Dío ben: «${formaActual}»`
                : `Sáelle «${formaActual === '' ? '…' : formaActual}»`}
          </p>
        ) : null}
      </div>

    </section>
  )
}

/**
 * Que cara pon. A ORDE importa: o de arriba gaña. Durmir tapa todo o
 * demais, falar tapa o malestar (é o seu momento), e «apagado» vai antes
 * ca «triste» porque a lección da ausencia é precisamente deixar de
 * chorar.
 */
function expresion(cova: Cova, temMalestar: boolean): Expresion {
  if ((cova.drives.enerxia ?? 100) < 20) {
    return 'durmido'
  }
  if (cova.di !== null) {
    return 'falando'
  }
  if (temMalestar && cova.mods.cala) {
    return 'apagado'
  }
  if (temMalestar) {
    return 'triste'
  }
  if ((cova.drives.fame ?? 0) >= 70) {
    return 'famento'
  }
  if ((cova.drives.apego ?? 0) >= LIMIAR_LEDICIA) {
    return 'contento'
  }
  return 'tranquilo'
}
// ── FIN: o panel do bebé ──
