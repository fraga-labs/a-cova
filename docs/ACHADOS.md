# ACHADOS DE CLIENTE ZERO

A Cova é o **cliente zero do crecemento en runtime** de Yggdrasil Forge. O que lle falte ao motor
sae de aquí como necesidade REAL documentada, non como especulación. Cada achado leva: que
esperabamos, que atopamos, como o rodeamos hoxe, e canto custa.

Estado a 2026-09-01, contra `@yggdrasil-forge/core@1.0.0` (instalado desde npm).

Ningún destes achados bloqueou o MVP. Ningún deles require tocar o motor hoxe.

---

## Achado 1 — o motor nunca calcula `unlockable` por si

**Esperabamos**: que, ao cambiar un recurso ou desbloquear un nodo, os nodos cuxos prerequisitos
pasan a estar satisfeitos transitasen de `locked` a `unlockable`, e que o renderer os pintase como
«dispoñibles».

**Atopamos**: `'unlockable'` está no tipo `NodeState`, no schema e no `SkillNode` (ten cor de tema
propia), pero **ningún camiño do `TreeEngine` o escribe**. Só o efecto `modify_node_state` pode
poñelo, e ese efecto só corre dentro dun `unlock()`. Non hai API pública para escribir estado de
instancia desde fóra (`applyChanges` muta a `TreeDef`, non o `TreeState`).

**Como o rodeamos**: a política de A Cova (`src/cova/politica.ts`, `reconciliarAutonomos`) percorre
os nodos con tag `auto` tras cada mutación e chama `unlock()`/`lock()` ela mesma. Para nós resultou
ser o comportamento correcto — un bebé non ten nodos «dispoñibles», ten nodos que aínda non existen
— pero foi unha decisión de deseño imposta polo motor, non escollida.

**Custo**: ningún para nós. Para un consumidor que SI queira o estado intermedio, é traballo
duplicado en cada consumidor.

**Petición razoable**: ou ben un `engine.refreshUnlockable()` opcional, ou ben documentar
explicitamente que `unlockable` é responsabilidade do consumidor (e por que).

---

## Achado 2 — `getNodeState` devolve `null` para nodos nunca tocados

**Esperabamos**: que un nodo declarado na `TreeDef` tivese sempre unha `NodeInstance` en
`TreeState.nodes`, en estado `locked`.

**Atopamos**: as instancias créanse perezosamente (no primeiro `unlock()`, ou no `add_node` vía
`applyChanges`). Nun motor recén construído, `getNodeState('malestar')` é `null`.

**Como o rodeamos**: tratamos `null` como `locked` en todas partes
(`engine.getNodeState(id)?.state ?? 'locked'`).

**Custo**: baixo, pero é unha pegada fácil de esquecer: `state === 'locked'` é `false` para un nodo
que si está bloqueado. Custounos un test.

**Petición razoable**: unha liña na documentación de `getNodeState`. Non cambiar o comportamento
(a creación perezosa é razoable).

---

## Achado 3 — `time_after`/`time_before` ignoran o reloxo inxectado

**Esperabamos**: que `TreeEngineOptions.timeNow` gobernase TODA a lóxica temporal, como di o seu
propio comentario («toda a lóxica temporal … use un reloxo virtual controlable»).

**Atopamos**: `TimeManager` (é dicir, `timeConstraints` e `tick()`) si o honra. Pero o
`UnlockResolver` avalía as condicións `time_after` e `time_before` con `Date.now()` **directo**
(`UnlockResolver.ts`, tanto en `evaluate` como en `explain`). Un motor con `timeNow` fixo dá
resultados incoherentes entre `tick()` e `canUnlock()`.

**Como o rodeamos**: nos tests da dixestión usamos `vi.setSystemTime()` (reloxo do sistema) en vez
do `timeNow` do motor. Funciona, pero é o reloxo equivocado: obriga a facer globais uns tests que
deberían ser locais ao motor.

**Custo**: medio. Fai que un mecanismo lexítimo do motor (prerequisitos temporais) non sexa
determinista en test sen recorrer a fake timers globais.

**Petición razoable**: pasar `now` no `UnlockResolverContext`, igual que xa se pasa `getStat`. É un
cambio pequeno e retrocompatible.

---

## Achado 4 — non hai `resource_max` (nin comparadores) nas condicións

**Esperabamos**: poder expresar «apego POR DEBAIXO de 30» directamente.

**Atopamos**: só existe `resource_min`.

**Como o rodeamos**: `{ type: 'none', conditions: [{ type: 'resource_min', … }] }` — o `none` é a
negación, e funciona perfectamente. Ver o nodo `tristura` en `src/cova/mente-semente.ts`.

**Custo**: ningún. **Non pedimos nada**: o rodeo é máis expresivo ca un `resource_max` e xa está no
contrato. Déixase escrito para que non se engada unha condición redundante «por completitude».

---

## Achado 5 — `lock()` non reverte os `effects` do nodo

**Esperabamos**: non tiñamos expectativa clara. Documentámolo porque é fácil asumir o contrario:
`EffectResult` garda `previousValue` «para soportar `reverse()`».

**Atopamos**: `lock()` devolve os **custos** (`refund`) pero non desfai os efectos. Un nodo que ao
acenderse fixo `sucidade +45` non resta 45 ao apagarse.

**Como o rodeamos**: a política desfai o que ten que desfacer de forma explícita (`limpar` pon a
sucidade a 0; non depende de que apagar a caca o faga).

**Custo**: ningún — de feito preferimos este comportamento, porque un efecto irreversible
(«pasou») e un custo reversible («pagouse») son cousas distintas.

**Petición razoable**: só documentalo. É unha decisión, non un fallo; que quede como decisión.

---

## Achado 6 — non hai onde gardar estado por-nodo do consumidor

**Esperabamos**: poder colgar dun nodo un dato noso que viaxe co estado (a nosa «frescura» por
palabra, para a curva do esquecemento).

**Atopamos**: `NodeDef.metadata` é da DEFINICIÓN (compartida, non por partida) e `TreeState.metadata`
existe no tipo pero non hai setter público.

**Como o rodeamos**: `EstadoPolitica.frescuras` vive fóra do motor, en React, e persístese ao lado do
`TreeState` no mesmo gardado de localStorage.

**Custo**: baixo pero real — hai dous estados que hai que gardar, cargar e manter en sincronía en vez
dun.

**Petición razoable**: un `engine.setStateMetadata(k, v)` / `getStateMetadata(k)`, ou aceptar que
o consumidor xestione o seu propio estado (é defendible; só hai que dicilo).

---

## Achado 7 — `setProgress` non ve os nodos nacidos en runtime · **bloqueante**

**Esperabamos**: poder usar as DÚAS pistas que un `NodeDef` ten —`progress` (0-100, continuo) e
`currentTier` (discreto)— no mesmo nodo. Era a peza central do deseño da linguaxe v2
(`docs/design/LINGUAXE.md`): comprensión como progreso, produción como rangos. As dúas viaxarían no
documento exportado sen que tivésemos que inventar nada.

**Atopamos**: `setProgress` devolve `NODE_NOT_FOUND` nun nodo que existe. `getNodeState` atópao,
`getTreeDef()` lévao, `unlock` funciona nel — pero `setProgress` non. A causa está no construtor de
`TreeEngine`:

```ts
this.progressManager = new ProgressManager({
  treeDef: this.store.getTreeDef(),   // ← unha COPIA, tomada unha soa vez
  store: this.store,
  ...
})
```

Todos os demais compoñentes reciben o `store` e len a través del; `ProgressManager` recibe ademais
un `treeDef` **conxelado no momento da construción**, e `setProgress` resolve o `NodeDef` contra ese
(`findNodeDef(this.context.treeDef, nodeId)`). Como `applyChanges` substitúe a TreeDef dentro do
store, o `ProgressManager` queda desactualizado para sempre.

Consecuencia: `progress`, `progressMilestones`, `getReachedMilestones` e `progressSource` son
**inutilizables en calquera nodo creado en runtime**. Para un consumidor cuxo caso de uso É o
crecemento en runtime, iso é a metade do contrato de progreso apagada.

**Como o rodeamos**: a familiaridade (dos sons) e a comprensión (das palabras) viven en
`EstadoPolitica.familiaridade`, en React, e persístense ao lado do `TreeState`. Os RANGOS si se
gardan no motor, que funcionan ben. É o mesmo rodeo có achado 6, agora nun sitio onde doe máis:
o documento exportado leva a produción no seu sitio pero a comprensión en `metadata`.

Isto obrigou tamén a quitar os `prerequisites` de tipo `progress_min` que apuntaban ao propio nodo:
como o progreso nunca sobe, o prerequisito nunca se cumpría e `unlock` fallaba sempre. Era a parte
máis bonita do deseño — o limiar do primeiro rango declarado no propio documento en vez de escondido
no código — e houbo que tirala.

**Custo**: alto. É o primeiro achado que **cambia o deseño** en vez de só incomodar.

**Petición razoable**: que `ProgressManager` lea `this.context.store.getTreeDef()` no momento de
usalo, igual que fan os demais. Unha liña, retrocompatible, e devolve un contrato enteiro.

---

## Achado 8 — quen coloca os nodos non sabe canto miden

`@yggdrasil-forge/react` decide o tamaño de cada nodo con dúas táboas internas
(`DEFAULT_RADIUS_BY_TYPE` e `DEFAULT_SHAPE_BY_TYPE`, en `SkillNode`) e **non exporta ningunha**,
nin unha función `nodeRadius(node)`. Un consumidor que calcula as posicións el mesmo —que é o
noso caso, e o que o layout `custom` convida a facer— non ten como preguntar canto ocupa o que
vai colocar.

Non é teórico. Colocabamos os nodos a 58 unidades cun comentario que dicía «un nodo mide uns 36»,
un número a ollo. Os números reais van de 16 (`small`) a 40 (`root`), e `milestone` debúxase como
un **cadrado de lado 2r**, así que pola esquina chega a `r·√2 = 34`. Resultado: `verbo` e `mais`
pisábanse **na mente semente**, é dicir, no primeiro segundo de cada partida, desde o primeiro día.
E as dúas primeiras memorias pisábanse en canto nacían.

Peor: como o script de estrés medía co mesmo 18 inventado, **dicía que non se pisaba nada**. Unha
medida coa mesma suposición errada có código que mide non é unha medida.

**Como o rodeamos**: `src/cova/colocacion.ts` copia as dúas táboas do renderer. Funciona e está
probado (`colocacion.test.ts`), pero é copiar unha constante privada doutro paquete: o día que o
renderer cambie un radio, a colocación segue crendo o vello e ninguén se entera.

**Custo**: medio. O fallo era permanente e visible, e o arranxo é un acoplamento que non se pode
verificar desde aquí.

**Petición razoable**: exportar `nodeRadius(node: NodeDef): number` e `nodeShape(node: NodeDef)`.
Non fai falta unha API nova — son as dúas funcións `resolveRadius`/`resolveShape` que xa existen
dentro do módulo, só que privadas.

---

## Achado 9 — os `effects` dun nodo non respectan o `max` do recurso

Hai dúas portas para escribir nun recurso e **só unha respecta o tope declarado**:
`grantResource` clampea a `[0, resource.max]`, e os `effects` de tipo `modify_resource` que
un nodo dispara ao acenderse non.

Reproducido, e é un caso normal de xogo:

```
sucidade (max 100) tras grantResource(+200) : 100   ← clampa
acende `caca`, cuxo efecto é `sucidade +45` : 145   ← non clampa
seguinte grantResource(+1)                  : 100   ← volve de golpe
```

O que ve quen xoga é unha barra ao 145 % que despois salta a 100 soa e sen motivo. O que ve
quen programa é peor: **o `max` do documento non é un invariante**, é só un clamp que aplica unha
das dúas portas. Se un consumidor declara un tope e escribe as súas regras contando con el, o
tope non se cumpre — e non hai aviso.

Detectouse ao facer que o tempo pasase durante a ausencia: volver despois de horas deixa a
sucidade no seu máximo e a caca disparándose xusto despois, que é exactamente a secuencia que
o destapa.

**Como o rodeamos**: `reclamparRecursos` en `politica.ts`, chamado despois de reconciliar os
autónomos. Réstalle a cada recurso o que lle sobre; non usa `grantResource(id, 0)` a propósito,
que sería volver confiar no clamp.

**Custo**: baixo, pero silencioso, que é o que o fai desagradable.

**Petición razoable**: aplicar o mesmo clamp na avaliación dos `effects`. Se hai unha razón para
non facelo (que un efecto poida pasar do tope a propósito), entón `max` debería documentarse como
«tope de `grantResource`» e non como tope do recurso.

---

## Nota — o que SI deu o motor sen pedirlle nada

Convén deixar constancia tamén do contrario, porque un documento que só recolle queixas mente.

Ao engadir as **sombras** (as leccións que nacen do abandono) non fixo falta nin unha liña de motor:

- A rexión nova entrou con `applyChanges([{ type: 'add_group' }, …])` na mesma transacción có seu
  primeiro nodo, e `computeLayout` recolocouno todo só.
- A conta do abandono é un `resource` máis (`soidade`), así que os prerequisitos das leccións son
  `resource_min` declarativos, non código escondido.
- Acender e apagar as leccións segundo a soidade sobe e baixa **xa o facía** a regra 1 da política,
  sen tocala: as sombras levan o tag `auto` e listo.
- «A cicatriz apágase pero non se borra» sae de balde da distinción entre `TreeDef` (o nodo segue
  aí) e `TreeState` (o nodo está `locked`). Non houbo que inventar un estado «cicatriz».

Iso son catro pezas do contrato encaixando nunha funcionalidade que non existía cando se deseñaron.

## Nota sobre os composites do editor

O TRASPASO apuntaba a usar `buildNewNode`/`buildConnect` de `@yggdrasil-forge/editor-core` para
escribir na mente. **Non se usan**: eses composites operan sobre un `EditorDocument` (o modelo do
editor), non sobre un `TreeEngine` en runtime. O camiño correcto para un consumidor de runtime é
`engine.applyChanges([...])`, que xa é transaccional e validado. Non é un achado nin unha carencia:
é a fronteira entre editar un documento e vivir dentro del, e está ben onde está.
