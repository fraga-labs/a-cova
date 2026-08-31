// ── INICIO: A Cova ──

import type { JSX } from 'react'
import { useState } from 'react'
import { EDITOR_URL, descargarBebe } from '../cova/exportar.js'
import { esquecerTodo } from '../cova/persistencia.js'
import { useCova } from '../cova/useCova.js'
import { Acontecementos } from './Acontecementos.js'
import { PanelBebe } from './PanelBebe.js'
import { PanelMente } from './PanelMente.js'

export function App(): JSX.Element {
  const cova = useCova()
  const [honestoAberto, setHonestoAberto] = useState(false)

  return (
    <div className="cova">
      <header className="cabeceira">
        <h1 className="marca">
          A COVA <span className="marca__dia">— día {cova.politica.dia}</span>
        </h1>
        <label className="nome">
          <span className="visualmente-oculto">Nome do bebé</span>
          <input
            type="text"
            value={cova.nome}
            maxLength={16}
            onChange={(e) => {
              cova.renomear(e.target.value)
            }}
          />
        </label>
        <div className="cabeceira__accions">
          <button
            type="button"
            className="accion accion--exportar"
            onClick={() => {
              descargarBebe({
                nome: cova.nome,
                tree: cova.engine.getTreeDef(),
                state: cova.engine.getSnapshot(),
                politica: cova.politica,
                acontecementos: cova.acontecementos,
              })
            }}
          >
            EXPORTAR BEBÉ
          </button>
          <a className="ligazon" href={EDITOR_URL} target="_blank" rel="noreferrer">
            abrir no editor ↗
          </a>
          <button
            type="button"
            className="ligazon"
            aria-expanded={honestoAberto}
            onClick={() => {
              setHonestoAberto((v) => !v)
            }}
          >
            que é isto?
          </button>
        </div>
      </header>

      {honestoAberto ? (
        <aside className="honesto">
          <p>
            <strong>Isto non é unha consciencia nin unha IA.</strong> É a estrutura dunha
            mente-rexistro: un grafo Yggdrasil que medra segundo regras deterministas que podes ler
            no código (<code>src/cova/politica.ts</code>).
          </p>
          <p>
            A semántica do bebé <strong>non ten grounding</strong>: «auga» é un nodo conectado a
            estímulos, non auga. Dicímolo aquí, na propia páxina, porque é o honesto.
          </p>
          <p>
            O principio reitor é a cova de Platón: o bebé só percibe o que ti lle proxectas. O que
            nunca lle ensinaches, non existe — e o que aprende cando <em>non</em> vas tamén queda
            escrito.
          </p>
          <p>
            As «sombras» (as leccións da ausencia) <strong>non son un modelo de apego infantil</strong>{' '}
            nin din nada sobre nenos reais. Son etiquetas nun grafo, escollidas porque fan un bo
            bucle de xogo.
          </p>
          <button
            type="button"
            className="ligazon"
            onClick={() => {
              if (window.confirm('Isto borra o bebé e empeza de cero. Seguro?')) {
                esquecerTodo()
                window.location.reload()
              }
            }}
          >
            empezar de cero
          </button>
        </aside>
      ) : null}

      <main className="taboleiro">
        <PanelBebe cova={cova} />
        <PanelMente cova={cova} />
      </main>

      <Acontecementos cova={cova} />
    </div>
  )
}
// ── FIN: A Cova ──
