# A COVA

Un tamagochi cuxa mente é un grafo [Yggdrasil](https://github.com/fraga-labs/yggdrasil-forge) que
medra en tempo real diante do coidador.

Principio reitor: **a cova de Platón**. O bebé só percibe o que o coidador proxecta. Non hai mundo
exterior; a súa mente enteira é o rexistro da crianza. Non simulamos unha mente — construímos unha
cova, e dicímolo.

> **O honesto, por diante.** Isto non é consciencia nin AGI: é a estrutura dunha mente-rexistro,
> sombras e relacións entre sombras. A semántica do bebé non ten grounding: «auga» é un nodo
> conectado a estímulos, non auga. Dise aquí e dise tamén na propia páxina do proxecto.

---

## Arrancalo

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run verificar
```

`verificar` fai as tres cousas que teñen que estar ben antes de entregar: tipos (`tsc`), probas
(`vitest`) e **validación do documento co CLI real** (`ygg validate`) — tanto a mente semente como
unha mente medrada en runtime.

## Que hai feito (fase A, sen LLM)

- **Bucle do corpo** — 5 drives (`fame`, `enerxía`, `sucidade`, `apego`, `curiosidade`) como
  `resources` do documento, cun reloxo que os fai derivar. Alimentar programa a dixestión
  (`time_after`) → **CACA** → a sucidade dispárase → o nodo **malestar acéndese só** e cobra apego.
  Limpar apaga as dúas cousas e volve armar a dixestión.
- **Bucle da linguaxe** — ensinar unha palabra fai **nacer un nodo** (`applyChanges`) colgado da
  voz, con 3 rangos: **1/3 oíuna · 2/3 compréndea · 3/3 dia**. Os rangos 2 e 3 só suben con
  **repetición en contexto** (a palabra ten que casar co estímulo activo). A primeira palabra a 3/3
  fai nacer unha memoria.
- **Conceptos** — dúas palabras a 3/3 do mesmo campo semántico fan nacer un nodo-concepto que as
  require (`all`). A mente gaña un piso.
- **Esquecemento** — as palabras teñen frescura que decae; sen reforzo baixan un rango, e ao final
  pérdense.
- **A cara** — bebé + accións á esquerda, **a mente en vivo** (SkillTree) á dereita, acontecementos
  con horas reais abaixo.
- **EXPORTAR BEBÉ** — descarga un documento Yggdrasil válido que abre no
  [editor público](https://fraga-labs.github.io/yggdrasil-forge/app/). *Same document, same
  decisions — agora tamén: same mind.*
- **Persistencia** — `localStorage` con clave versionada (`a-cova:v1`); o gardado de verdade é
  exportar.

Cero cambios de motor: `@yggdrasil-forge/core`, `/react` e `/common` veñen **de npm**, como
consumidores.

## Onde está cada cousa

| Ficheiro | Que é |
| --- | --- |
| `src/cova/mente-semente.ts` | A mente coa que nace: 13 nodos en 5 rexións. Documento válido desde o día un. |
| `src/cova/politica.ts` | **O corazón novo.** As 5 regras de crecemento. Puro respecto de React; testado. |
| `src/cova/lexico.ts` | A táboa de estímulos e campos semánticos. Está á vista a propósito. |
| `src/cova/drives.ts` | Os 5 drives, os limiares e as constantes do reloxo. |
| `src/cova/useCova.ts` | O cableado: motor + reloxo + política + React. |
| `src/cova/exportar.ts` | Exportar bebé como documento Yggdrasil. |
| `src/ui/` | Os dous paneis e a franxa inferior. |
| `docs/ACHADOS.md` | **Achados de cliente zero** contra o motor. Necesidades reais, non especulación. |
| `TRASPASO.md` | O documento fundacional (concepto v0.1 do dono + north star visual). |

## Decisións tomadas nesta quenda

As catro decisións pendentes do TRASPASO §2 quedaron nos defaults propostos:

1. **Nome**: A Cova. `Meco` como nome do bebé por defecto (editable na cabeceira).
2. **Voz**: só texto no MVP (bocadillo de cómic). Audio, fase 2.
3. **Persistencia**: `localStorage` versionado + EXPORTAR BEBÉ como gardado real.
4. **Prioridade**: executor propio; GAIA non se para.

Ademais, tres decisións de deseño que non estaban no doc e que se toman aquí:

- **Un nodo raíz `eu`** no centro da mente: o único que non lle ensinou ninguén. Fai que o grafo
  teña centro e que o layout `clustered-radial` teña de que colgar as cinco rexións.
- **A mente semente ten 13 nodos**, non ~6: o mockup pinna cinco rexións e unha rexión baleira non
  se ve. Cada rexión leva a súa áncora.
- **A promesa `+ máis`** existe como nodo real que nunca se desbloquea — a affordance de crecemento
  visible NO grafo, como no mockup.

## O que falta (seguintes quendas)

- Arte: o pixel-art do mockup. O de agora é **placeholder declarado** (unha grella de texto en
  `src/ui/Bebe.tsx`).
- Recuperar o PNG orixinal do mockup do dono e gardalo como `docs/mockup-north-star.png`.
- Fase B: a imaxinación por LLM (candidato JSON → `validate` → só o san se enxerta).
- Temperamentos como sets de plugins; soñar como sesión de Proba; compartir bebé con `shareBuild`.

## Licenza

MIT. Proxecto irmán baixo [fraga-labs](https://github.com/fraga-labs).
