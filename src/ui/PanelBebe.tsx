// ── INICIO: o panel do bebé ──
// Columna esquerda do mockup: estado, o bebé, a alerta, as accións e a
// ensinanza cos tres tiers á vista.

import type { JSX } from 'react'
import { useState } from 'react'
import { DRIVE_SPECS, LIMIAR_SUCIDADE } from '../cova/drives.js'
import { ESTIMULOS } from '../cova/lexico.js'
import { idPalabra } from '../cova/politica.js'
import { ACCIONS, type Cova } from '../cova/useCova.js'
import { Bebe } from './Bebe.js'

const TIERS = [
  { n: 1, etiqueta: 'OÍUNA', cor: '#5aa9e0' },
  { n: 2, etiqueta: 'COMPRÉNDEA', cor: '#e8c547' },
  { n: 3, etiqueta: 'DIA!', cor: '#6fbf73' },
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
  const tierAmostra =
    palabraAmostra === null
      ? 0
      : (cova.engine.getNodeState(idPalabra(palabraAmostra))?.currentTier ?? 0)

  const estimulo = ESTIMULOS[cova.politica.estimulo]

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

      <Bebe
        temCaca={temCaca}
        durmido={(cova.drives.enerxia ?? 100) < 20}
        triste={temMalestar}
        di={cova.di}
      />

      {temCaca ? (
        <p className="alerta" role="status">
          CACA! Debes limpar ao bebé.
          {sucidade >= LIMIAR_SUCIDADE ? ' A sucidade está alta!' : ''}
        </p>
      ) : null}
      {temMalestar ? (
        <p className="alerta alerta--forte" role="status">
          Chora. Leva demasiado tempo sucio e o apego vai baixando.
        </p>
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
        {estimulo.palabras.length > 0 ? (
          <>
            {' '}
            Só entende palabras <em>en contexto</em>: {estimulo.palabras.slice(0, 4).join(' · ')}
          </>
        ) : (
          ' Fóra de contexto só oe as palabras; non as comprende.'
        )}
      </p>

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

      <ul className="tiers">
        {TIERS.map((t) => (
          <li key={t.n} className={`tier${tierAmostra >= t.n ? ' tier--feito' : ''}`}>
            <span className="tier__n">{t.n}/3</span>
            <span className="tier__barra">
              <span
                className="tier__cheo"
                style={{
                  width: tierAmostra >= t.n ? '100%' : '0%',
                  background: t.cor,
                }}
              />
            </span>
            <span className="tier__etiqueta">
              {t.etiqueta}
              {t.n === 3 && tierAmostra >= 3 ? ' ★' : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
// ── FIN: o panel do bebé ──
