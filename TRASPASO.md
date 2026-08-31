# TRASPASO — A COVA (2026-08-31)

Documento fundacional e de traspaso entre chats. Escrito polo Executor da sesión de yggdrasil-forge
(D:\gaia-frontend, sesión b4b06457) para que un chat novo aberto NESTE directorio arranque con todo.
**Instrución para o chat novo: le este ficheiro enteiro antes de tocar nada.**

---

## 0. Quen somos e como traballamos

- O dono é **Agarfal** (galego; GitHub org **fraga-labs** — «Agarfal é lafraga o revés»).
- Modelo de roles herdado de yggdrasil-forge: **Director** (outro chat, emite briefings) / **Executor** (eu) / dono.
  Para A Cova o dono decidiu **executor propio** — este proxecto pode ir por libre, con briefings ou co dono en directo.
- Regras do Executor que viaxan con nós:
  - Nunca push/merge por defecto: as entregas rematan cos **comandos git listos** para que o dono os execute.
  - Segredos nunca no chat: «o briefing NON leva segredos: instrucións, non valores».
  - Verificar antes de entregar (build + probas); nunca dous camiños alternativos ao desfacer algo en git — un só comando.
- Idioma de traballo: galego. Commits con `HUSKY=0` se hai hooks, e trailer `Co-Authored-By`.

## 1. Que é A Cova (concepto v0.1 do dono, VERBATIM)

Un tamagochi cuxa mente é un grafo Yggdrasil que medra en tempo real diante do coidador. Principio reitor: a cova de Platón. O bebé só percibe o que o coidador proxecta. Non hai mundo exterior; a súa mente enteira é o rexistro da crianza. Non simulamos unha mente — construímos unha cova, e dicímolo.

(Nome provisional. Alternativas para o dono: Berce · Meco · A Cova. Decisión súa.)

### 1.1 Os tres bucles

**Bucle do CORPO (determinista, o tamagochi clásico)**
- Drives como recursos (clampeados 0..max): `fame`, `enerxía`, `sucidade`, `apego`, `curiosidade`.
- O tempo pasa (`tick`): fame sobe, enerxía baixa.
- Alimentar → fame baixa + prográmase a dixestión (`time_after`) → CACA (evento visible, con toda a súa dignidade cómica) → `sucidade` dispárase.
- Limpar → sucidade a 0. Non limpar → o nodo malestar desbloquéase só (`resource_min: sucidade ≥ X`) → chorar, apego baixa.
- Durmir, xogar, aloumiñar: mesmo patrón. O ciclo coidado-consecuencia é o contrato emocional do xénero.

**Bucle da LINGUAXE (os tiers renacen)**
- O coidador ensina palabras (escribe ou fala). A política de crecemento fai nacer o nodo-palabra (rexión Linguaxe):
  - 1/3 — oíuna · 2/3 — compréndea (repetición en contexto: a palabra coincide co estímulo activo) · 3/3 — DIA (evento de fala: o bebé di a súa palabra).
- A primeira palabra é un nodo chegando a maxed en directo. Momento gardable e compartible por deseño.
- Conceptos: dúas palabras a 3/3 relacionadas por uso → nace un nodo-concepto que as require (`all`). A mente gaña pisos.
- O que nunca lle ensinaches, non existe. A cova.

**Bucle do CRECEMENTO (a política — o único corazón novo)**
- Fase A (regras, determinista): estímulo repetido → memoria; coincidencias → conceptos; abandono prolongado → `lock()` (esquecer, con refund de "enerxía mental") e, en extremos, poda con cascada. Crible, testable, sen maxia.
- Fase B (a imaxinación por LLM): o bebé "matina" → un LLM xera un candidato de nodo/relación en JSON contra o noso schema → `validate` → só o san se enxerta. A vía do dato enteira como sistema inmunolóxico dunha mente que medra.
- Mecánica de escritura: os composites do editor headless (`buildNewNode`/`buildConnect`/cascada, transaccións validadas). O aparello xa existe; a política é o proxecto.

### 1.2 A cara
- Esquerda: o bebé (arte simple, expresivo — os drives á vista, a caca cando toca) + as accións do coidador (alimentar · limpar · xogar · durmir · ensinar palabra).
- Dereita: A MENTE — o SkillTree en vivo, rexións (Corpo · Linguaxe · Afectos · Conceptos), nodos acendéndose, nacendo, esquecéndose. Posición = importancia.
- Exportar o bebé = un documento Yggdrasil. Ábrese no editor. Same document, same decisions — agora tamén: same mind.

### 1.3 O honesto (declarado, non escondido)
- Non é consciencia nin AGI: é estrutura dunha mente-rexistro, sombras e relacións entre sombras. A cova é o pitch, non a desculpa.
- A semántica do bebé non ten grounding: "auga" é un nodo conectado a estímulos, non auga. Dicímolo na propia páxina do proxecto.
- Proxecto irmán baixo fraga-labs (consumidor de Yggdrasil, como GAIA) — o **cliente zero do crecemento en runtime**. O que lle falte ao motor sae como necesidade real documentada, non como especulación.

### 1.4 Rebanada MVP (fase A enteira, sen LLM)
Un bebé · 5 drives · 6 accións · mente semente de ~6 nodos · linguaxe por tiers coa primeira palabra · caca e malestar · esquecer por abandono · a mente en vivo á dereita · exportar/abrir no editor. **Cero cambios de motor** (se algún fai falta, é achado de cliente zero e trámase como tal).

## 2. As catro decisións do dono + defaults propostos polo Executor

O dono aínda NON as pechou. Defaults propostos (pendentes do seu «dalle» ou emenda):

1. **Nome**: A Cova (repo `fraga-labs/a-cova`). Berce/Meco quedan como nomes do bebé por defecto.
2. **Voz**: só texto/balbucido escrito no MVP; audio por síntese en fase 2 (TUERCA xa ten voces por seed — a receita existe na casa).
3. **Persistencia**: navegador — localStorage con clave versionada + botón EXPORTAR BEBÉ como gardado real (patrón xa probado no editor de yggdrasil-forge).
4. **Prioridade**: executor propio en paralelo; GAIA non se para.

## 3. O NORTH STAR VISUAL (mockup pixel-art do dono, 2026-08-30)

**PENDENTE: pedirlle ao dono o PNG orixinal e gardalo como `docs/mockup-north-star.png` no primeiro commit.**

Descrición fiel do mockup:

- **Estética**: pixel-art escuro, fondo estrelado na mente (constelación), paneis con bordo groso estilo consola retro, tipografía monospace/pixel. Cabeceira esq. «A COVA — día 27»; der. «A MENTE DO BEBÉ» + botón «EXPORTAR BEBÉ» + engrenaxe.
- **Columna esquerda (o bebé)**:
  - ESTADO DO BEBÉ: 5 barras con icona e valor (fame 42/100 laranxa · enerxía 68 amarela · sucidade 78 parda · apego 85 rosa · curiosidade 62 verde).
  - O bebé: criatura adorable con cornos pequenos, sentada nun tobo dentro dunha cova con fogueira e planta; bocadillo de cómic cunha caca.
  - Alerta de evento: «CACA! Debes limpar ao bebé. A sucidade está alta!» (vermello).
  - QUE QUERES FACER?: 6 botóns — ALIMENTAR (biberón) · LIMPAR (cueiro) · XOGAR (pelota) · ALOUMIÑAR (mans+corazón) · DORMIR (lúa) · ENSINAR PALABRA (bocadillo).
  - ENSINANDO: AUGA — os TRES TIERS á vista como barras: 1/3 OÍUNA (azul) · 2/3 COMPRENDEA (amarela) · 3/3 DIA! (verde, con estrela).
- **Panel dereito (a mente = SkillTree en vivo)**:
  - Chips de rexión: CORPO (laranxa) · LINGUAXE (violeta) · AFECTOS (rosa) · CONCEPTOS (verde) · **MEMORIAS (azul)** ← rexión NOVA que o mockup engade sobre o doc v0.1. Nodos autobiográficos: «primeira comida», «xogo coidado», «primeira palabra ★».
  - CORPO: caca no centro conectada a fame/sede/enerxía/sucidade/malestar (bordo laranxa = maxed/activo).
  - LINGUAXE: auga DESTACADA (seleccionada, brillo) conectada a mamá/papá/comer/baño/dormir e a un nodo «+ máis» (a affordance de crecemento visible NO grafo).
  - AFECTOS: apego (corazón) central con feliz/triste/tranquilo/medo.
  - CONCEPTOS: auga-concepto conectada a beber/bebida/frío/choiva; conexión punteada vertical con dormir (linguaxe) e coa memoria «primeira palabra» — as arestas ENTRE rexións van punteadas.
  - LENDA: nodo descoñecido (bordo tenue) / descuberto (bordo claro) / máximo (bordo laranxa). FILTROS: «mostrar conexións fracas». ZOOM −/100%/+.
- **Franxa inferior**:
  - ÚLTIMOS ACONTECEMENTOS: liña temporal con horas (10:38 ensinache auga · 10:35 entendeu auga 2/3 · 10:32 oíu auga 1/3 · 10:28 caca! · 10:20 xogastes xuntos).
  - O QUE APRENDÍN HOXE (recadro violeta co bebé celebrando): «+1 palabra (auga) · +1 concepto (bebida) · moitos achuchóns ❤».
- **Decisións que o mockup pinna e o doc v0.1 non tiña**: (1) rexión Memorias; (2) contador de días; (3) resumo diario «o que aprendín hoxe»; (4) o «+ máis» como nodo-promesa no grafo; (5) a ensinanza visible simultaneamente nos dous paneis; (6) horas reais nos acontecementos, non ticks abstractos.

## 4. IDEAS DO EXECUTOR — cada unha co aparello REAL que xa existe en yggdrasil-forge

1. **O temperamento é un plugin.** plugin-foco (tutorial 17.4) é atención infantil literal; o test de veteranía (17.9) é momentum de aprendizaxe. Temperamentos = sets de plugins: curioso/teimudo/esquecedizo. O documento leva `metadata.temperamento`. *Aparello: sistema de plugins + funil computeCost, feito.*
2. **Soñar = modo Proba.** Sesión de Proba (non persiste, con Reiniciar) sobre a súa propia mente mentres dorme; ao espertar nada persiste… agás quizais UNHA memoria («soñei con auga»). *Aparello: useProbaSession, feito.*
3. **Compartir o bebé = shareBuild.** `TreeEngine.shareBuild()`/`loadFromShareLink()` xa existen; `ygg render` saca o SVG da mente no día N. *Aparello: 100% feito.*
4. **«Últimos acontecementos» = o audit log.** `getAuditLog()` rexistra cada mutación con timestamp e causa; a rexión Memorias DESTÍLASE do audit, non se inventa. *Aparello: AuditLogger, feito.*
5. **A curva do esquecemento xa ten estado.** `tick()`, `TimeManager`, `time_after`, estado `expired`. Ebbinghaus de serie: progress decae por tick sen reforzo. *Aparello: feito; a política é config.*
6. **As exclusións como disonancia.** `exclusions` mutuas = crenzas incompatibles; escoller unha véta a outra (`disabled`). *Aparello: feito.*
7. **O pediatra = os validadores brandos.** Panel Problemas (conceptos orfos, ciclos) como revisión do desenvolvemento. *Aparello: registry de validadores, feito; só cambia o ton.*
8. **O bebé pode vivir DENTRO dun xogo.** Bundle embebible 17.7 (`@yggdrasil-forge/core/global`, QuickJS/Jint/puerts/GodotJS con test de fume en CI): a mente criada corre nun xogo de Godot/Unity. Crossover TUERCA posible. *Aparello: feito e con porta de CI.*
9. **`progressSource` anticipa os estímulos.** manual/event/computed/remote xa tipados; «repetición en contexto» é `event`; concepto que medra coas súas palabras é `computed (avg)`. *A avaliación event/computed é o primeiro achado probable de cliente zero.*
10. **A Cova como funil de Yggdrasil.** «EXPORTAR BEBÉ → ábrese no editor» é a mellor demo do editor: chegan polo bebé, quedan pola ferramenta. Produto E onboarding.

**Aviso de honestidade**: os puntos 1–9 reutilizan aparello verificado, pero o corazón novo — a política de crecemento (fase A) — non hai plugin que o regale: **é o proxecto**.

## 5. Plan da primeira quenda (proposto, pendente de «dalle»)

- Scaffold: Vite + React + `@yggdrasil-forge/core` e `@yggdrasil-forge/react` **desde npm** (somos consumidor, coma GAIA — todo o que falte é achado de cliente zero e documéntase como tal).
- A mente semente: ~6 nodos nas rexións do mockup, documento Yggdrasil válido (`ygg validate` desde o día un).
- Bucle do corpo: 5 drives como `resources`, `tick` co tempo, alimentar→dixestión→CACA→sucidade→malestar.
- A cara en dous paneis: bebé+accións á esquerda (arte placeholder; o pixel-art fino vén despois), SkillTree en vivo á dereita.
- EXPORTAR BEBÉ funcionando (ábrese no editor público https://fraga-labs.github.io/yggdrasil-forge/app/).
- **Primeiro fito visible**: a caca aparecendo no lenzo e o nodo malestar acendéndose só na mente.

## 6. Contexto do ecosistema (estado a 2026-08-31)

- **yggdrasil-forge**: monorepo pnpm+Turbo, 6 paquetes funcionais publicados en npm a 1.0.x (common/core/react/editor-core/editor-react/cli, grupo linked). Docs: https://fraga-labs.github.io/yggdrasil-forge/ · Editor vivo: …/app/ · Repo: https://github.com/fraga-labs/yggdrasil-forge
- Migración á org fraga-labs feita a nivel código (rama `executor/migracion-fraga-labs`); o merge/push e o tren de release (Version Packages + `changeset:publish` con OTP) son tarefas do dono NO CHAT VELLO, non deste proxecto.
- A memoria persistente do Executor vive en `C:\Users\tajes\.claude\projects\D--gaia-frontend\memory\` (ficheiro `a-cova-concepto.md`) — **non se carga automaticamente desde este directorio**; por iso existe este TRASPASO.
- GAIA (D:\gaia-frontend / D:\gaia-backend) segue sendo a era principal; A Cova corre en paralelo.
