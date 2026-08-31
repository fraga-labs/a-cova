# A COVA

Un tamagochi cuxa mente é un grafo [Yggdrasil](https://github.com/fraga-labs/yggdrasil-forge) que
medra en tempo real diante do coidador.

Principio reitor: **a cova de Platón**. O bebé só percibe o que o coidador proxecta. Non hai mundo
exterior; a súa mente enteira é o rexistro da crianza. Non simulamos unha mente — construímos unha
cova, e dicímolo.

> **O honesto, por diante.** Isto non é consciencia nin AGI: é a estrutura dunha mente-rexistro,
> sombras e relacións entre sombras. A semántica do bebé non ten grounding: «auga» é un nodo
> conectado a estímulos, non auga. Dise aquí e dise tamén na propia páxina do proxecto.
>
> As «sombras» (o que aprende cando o desatendes) **non son un modelo de apego infantil** nin
> pretenden dicir nada sobre nenos reais. Son etiquetas nun grafo, escollidas porque fan un bo
> bucle de xogo.

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

```bash
npm run estres 200
```

`estres` responde á pregunta «e se aprende douscentas palabras, vese algo?» sen opinar: cría un bebé
de N palabras, calcula o MESMO layout que usa a app e conta cantos nodos se pisan.

`verificar` fai as tres cousas que teñen que estar ben antes de entregar: tipos (`tsc`), probas
(`vitest`) e **validación do documento co CLI real** (`ygg validate`) — tanto a mente semente como
unha mente medrada en runtime (esa escríbea a proba de exportar, por iso vai despois de `test`).

Para ver o resultado do `build` tal e como o vería outra persoa:

```bash
npm run build && npm run preview
```

## Non leva IA. Nin unha liña.

Pregunta lexítima, porque o proxecto fala de mentes: **A Cova non usa ningún modelo de linguaxe,
nin chama a ningún servizo, nin ten clave de API**. Todo o que fai o bebé sae de regras
deterministas que podes ler en dous ficheiros: `src/cova/politica.ts` (as regras) e
`src/cova/lexico.ts` (a táboa de que palabra casa con que estímulo). Se non entende «auga» é porque
«auga» non está nesa táboa, non porque un modelo decidise nada.

Comprobable: as dependencias de execución son React e tres paquetes de Yggdrasil Forge, e no código
non hai nin un `fetch`. O único `fetch` do bundle construído é o *modulepreload* que mete Vite para
cargar os seus propios ficheiros.

A fase B do plan **si** contempla un LLM («a imaxinación»: o bebé matina, un modelo propón un nodo
en JSON, valídase contra o schema e só se enxerta o san). **Non está feita**, e cando se faga terá
que ser opcional e dicilo na cara.

## Pasarllo a outra persoa

A app é **estática**: `npm run build` deixa en `dist/` tres ficheiros (un HTML, un JS, un CSS, ~460
kB) con rutas relativas. Non hai servidor, nin base de datos, nin contas, nin nada que saia do
navegador. Vale calquera sitio que sirva ficheiros.

**O camiño curto — GitHub Pages.** O repo xa trae `.github/workflows/pages.yml`. Despois de subilo
a GitHub, en *Settings → Pages* escolle **Source: GitHub Actions** e cada `push` a `main` publica
soa. O workflow corre `npm run verificar` antes: se a mente semente deixase de ser un documento
Yggdrasil válido, non se publica.

**Que ve a outra persoa**: a súa propia cova, en branco. O bebé vive no `localStorage` do SEU
navegador — non hai bebés compartidos nin nada que chegue a ti. Cada quen cría o seu.

**Compartir un bebé concreto** é outra cousa e xa funciona: **EXPORTAR BEBÉ** descarga un `.json`
que é un documento Yggdrasil válido. Quen o reciba pode abrilo no
[editor público](https://fraga-labs.github.io/yggdrasil-forge/app/) e ver a mente enteira —
que palabras aprendeu, que conceptos naceron, e que leccións lle deixou a ausencia.

## Que hai feito (fase A, sen LLM)

- **Bucle do corpo** — 5 drives (`fame`, `enerxía`, `sucidade`, `apego`, `curiosidade`) como
  `resources` do documento, cun reloxo que os fai derivar. Alimentar programa a dixestión
  (`time_after`) → **CACA** → a sucidade dispárase → o nodo **malestar acéndese só** e cobra apego.
  Limpar apaga as dúas cousas e volve armar a dixestión.
- **Bucle da linguaxe** (v2, ver [docs/design/LINGUAXE.md](docs/design/LINGUAXE.md)) — tres capas
  separadas, porque aprender a falar non é un só contador:
  - **SONS** — cada fonema que oe é un nodo con tres rangos. Ensinar *fóra* de contexto xa non é
    tempo perdido: dálle sons. As vogais son case de balde; o `/rr/` é o que máis custa.
  - **ATENCIÓN CONXUNTA** — non hai temporizador: hai unha cousa á que se atende, e a atención
    **decae**. Ensinar xusto despois da acción vale moito máis ca ensinar tarde.
  - **COMPRENDER ≠ FALAR** — a comprensión é continua (0-100 %) e a produción vai por rangos, e
    cada rango pide **as dúas cousas**: entender abondo *e* ter os sons. Por iso hai un tramo no
    que **enténdea enteira e aínda non lle sae**, e por iso «auga» sáelle `aa` → `aua` → `auga`.
- **Conceptos** — dúas palabras que xa di **e que se aprenderon na mesma situación** fan nacer un
  nodo-concepto que as require (`all`). A mente gaña un piso. Funciona con calquera palabra: antes
  dependía dunha táboa pechada de 28 e, en canto o vocabulario se liberou, deixaron de nacer.
- **Esquecemento** — as palabras teñen frescura que decae; sen reforzo baixan un rango, e ao final
  pérdense.
- **As sombras** — o que aprende cando **non** vas. Unha `soidade` acumúlase por cada necesidade
  crítica sen atender e fai nacer leccións de supervivencia nunha rexión propia: *calmarse só*,
  *dormir cun ollo aberto*, *comer coma se non fose haber máis*, *deixar de chamar*. Non son
  castigos: cada unha dá algo e quita algo. Coidalo apágaas, pero **o nodo queda na mente para
  sempre** e viaxa no documento exportado.
- **A cara** — bebé + accións á esquerda, **a mente en vivo** (SkillTree) á dereita, acontecementos
  con horas reais abaixo. O bebé ten oito expresións (tranquilo · contento · triste · famento ·
  durmido · falando · apagado · pestanexo), respira, pestanexa e chora bágoas de verdade.
- **Sonidiños** — sintetizados con WebAudio, **cero ficheiros de audio**: o `dist` segue sendo tres
  ficheiros. Cada acción e cada acontecemento teñen a súa voz, e o bebé **balbucea** a palabra que
  di — sempre a mesma melodía para a mesma palabra, así soa coma a súa voz e non coma ruído. Botón
  de silencio na cabeceira, e lémbrase.
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
| `src/cova/linguaxe.ts` | Sons, atención, comprensión e produción. O bucle da fala. |
| `src/cova/colocacion.ts` | Onde vai cada nodo. Filotaxe, para que non se pisen nin con mil. |
| `src/cova/fonoloxia.ts` | Como lle sae unha palabra cos sons que domina. Puro e testado. |
| `src/cova/lexico.ts` | A táboa de estímulos e campos semánticos. Está á vista a propósito. |
| `src/cova/sombras.ts` | As leccións da ausencia e o que lle cambian ao mundo. |
| `src/cova/drives.ts` | Os 5 drives, os limiares e as constantes do reloxo. |
| `src/cova/useCova.ts` | O cableado: motor + reloxo + política + React. |
| `src/cova/exportar.ts` | Exportar bebé como documento Yggdrasil. |
| `src/cova/son.ts` | As voces, sintetizadas. Nin un ficheiro de audio. |
| `src/ui/Bebe.tsx` | O pixel-art: un corpo base e catro filas que enche cada expresión. |
| `src/ui/tema.ts` | O tema do grafo. Sen el, o `SkillTree` colle un tema de fondo claro. |
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
- **Unha sexta rexión, SOMBRA**, que non está na semente: o seu grupo nace coa primeira lección da
  ausencia. Un bebé ben coidado nunca chega a ver ese chip. E a `soidade` é un `resource` do
  documento sen barra na UI — o coidador non a manexa, sófrea.

## O que falta (seguintes quendas)

- Arte: o pixel-art do mockup. O de agora é **placeholder declarado** (unha grella de texto en
  `src/ui/Bebe.tsx`).
- Recuperar o PNG orixinal do mockup do dono e gardalo como `docs/mockup-north-star.png`.
- Fase B: a imaxinación por LLM (candidato JSON → `validate` → só o san se enxerta).
- Temperamentos como sets de plugins; soñar como sesión de Proba; compartir bebé con `shareBuild`.

## Licenza

MIT. Proxecto irmán baixo [fraga-labs](https://github.com/fraga-labs).
