// ── INICIO: A Cova ──

import type { JSX } from 'react'
import { useState } from 'react'
import { EDITOR_URL, descargarBebe } from '../cova/exportar.js'
import { lerBebe } from '../cova/importar.js'
import { esquecerTodo, gardar } from '../cova/persistencia.js'
import { estaSilenciado, silenciar, tocar } from '../cova/son.js'
import { useCova } from '../cova/useCova.js'
import { Acontecementos } from './Acontecementos.js'
import { PanelBebe } from './PanelBebe.js'
import { PanelMente } from './PanelMente.js'
import { useSons } from './useSons.js'

export function App(): JSX.Element {
  const cova = useCova()
  const [honestoAberto, setHonestoAberto] = useState(false)
  const [mudo, setMudo] = useState(() => estaSilenciado())
  const [erroImportar, setErroImportar] = useState<string | null>(null)

  // Meter un bebé substitúe o que hai. É a única acción da páxina que
  // destrúe algo, así que pregunta antes — e pregunta DESPOIS de ler o
  // ficheiro, para non facer perder nada por un ficheiro que nin vale.
  async function importar(ficheiro: File): Promise<void> {
    const r = lerBebe(await ficheiro.text())
    if (!r.ok) {
      setErroImportar(r.erro)
      return
    }
    setErroImportar(null)
    const aviso = `Isto substitúe a ${cova.nome} polo bebé «${r.bebe.nome}» (día ${r.bebe.politica.dia}). Non hai volta atrás. Seguro?`
    if (!window.confirm(aviso)) {
      return
    }
    gardar(r.bebe)
    window.location.reload()
  }

  useSons(cova)

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
            className="ligazon ligazon--son"
            aria-pressed={!mudo}
            title={mudo ? 'Activar o son' : 'Silenciar'}
            onClick={() => {
              const novo = !mudo
              silenciar(novo)
              setMudo(novo)
              // Unha nota ao acender: confirma que o audio funciona e
              // de paso desbloquea o AudioContext co propio clic.
              if (!novo) {
                tocar('oe')
              }
            }}
          >
            {mudo ? '🔇' : '🔊'}
            <span className="visualmente-oculto">{mudo ? 'son apagado' : 'son aceso'}</span>
          </button>
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
          <label className="accion accion--exportar accion--importar">
            IMPORTAR BEBÉ
            <input
              type="file"
              accept="application/json,.json"
              className="visualmente-oculto"
              onChange={(e) => {
                const f = e.target.files?.[0]
                // Limpar o valor: se non, escoller o MESMO ficheiro dúas
                // veces seguidas non dispara `change` e parece roto.
                e.target.value = ''
                if (f !== undefined) {
                  void importar(f)
                }
              }}
            />
          </label>
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

      {erroImportar !== null ? (
        <p className="alerta alerta--forte" role="alert">
          Non se puido importar: {erroImportar}
        </p>
      ) : null}

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
