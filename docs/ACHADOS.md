# ACHADOS DE CLIENTE ZERO

A Cova é o **cliente zero do crecemento en runtime** de Yggdrasil Forge. O que lle falte ao motor
sae de aquí como necesidade REAL documentada, non como especulación. Cada achado leva: que
esperabamos, que atopamos, como o rodeamos hoxe, e canto custa.

Estado a 2026-08-31, contra `@yggdrasil-forge/core@1.0.0` (instalado desde npm).

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

## Nota sobre os composites do editor

O TRASPASO apuntaba a usar `buildNewNode`/`buildConnect` de `@yggdrasil-forge/editor-core` para
escribir na mente. **Non se usan**: eses composites operan sobre un `EditorDocument` (o modelo do
editor), non sobre un `TreeEngine` en runtime. O camiño correcto para un consumidor de runtime é
`engine.applyChanges([...])`, que xa é transaccional e validado. Non é un achado nin unha carencia:
é a fronteira entre editar un documento e vivir dentro del, e está ben onde está.
