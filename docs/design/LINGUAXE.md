# A LINGUAXE — deseño v2

Estado: **capas 0, 1 e 2 implementadas** (slice A+B). As capas 3 a 6 seguen sendo proposta.
O que se describe abaixo como «o que está mal» era a v1, xa substituída.

---

## 1. O que está mal hoxe

A v1 ten unha soa regra: *palabra + estímulo que casa, tres veces → sábea*. Funciona como
demostración e é honesta, pero colapsa **cinco cousas distintas nun só contador**:

| O que a v1 mestura | Por que importa que estean separadas |
| --- | --- |
| entender e falar | Un bebé entende ~50 palabras cando di 10. Non é o mesmo eixe. |
| saber a palabra e saber dicila | «auga» sáelle «aua» moito antes de saírlle «auga». |
| oír unha palabra e aprender que significa | Oíla sen atención non ensina nada… pero non é inútil: ensina *sons*. |
| significar unha cousa e significar **de máis** | O erro clásico é chamarlle «can» ao gato. Iso é aprender, non fallar. |
| ter palabras e ter linguaxe | Xuntar dúas palabras é un salto, non máis do mesmo. |

E hai un problema de xogo: **tres clics e xa fala**. Non hai curva, non hai espera, non hai
o momento de «enténdeo pero aínda non lle sae».

---

## 2. Como se aprende un idioma de verdade

Só o que ten consecuencia mecánica. Non é un tratado; é o que dá xogo.

1. **Primeiro son os sons, non as palabras.** O bebé balbucea antes de falar, e vai afinando
   o inventario de sons da lingua que oe. As primeiras palabras están limitadas polos sons que
   xa domina; o que non domina, **substitúeo ou cómeo**: *auga → aua → auga*.
2. **Atención conxunta.** Unha palabra só se pega a un significado se os dous estades a mirar
   o mesmo. Fóra diso, o bebé oe ruído con forma.
3. **Comprender vai moi por diante de falar.** Meses, na vida real.
4. **Sobreextensión.** «Can» pasa a significar can, gato, vaca e cabalo. Despois vaise
   estreitando a medida que chegan contrastes.
5. **Exclusividade mutua.** Se xa sabe «pelota» e lle dis unha palabra nova diante dunha
   pelota e dunha cousa descoñecida, a palabra nova vai para a descoñecida. É unha aposta, e
   ás veces sae mal.
6. **Estoupido de vocabulario.** Ao redor das 50 palabras, a cousa acelera de golpe: unha soa
   exposición xa abonda (*fast mapping*).
7. **Dúas palabras.** «Máis papa». Aí deixa de ser unha lista e empeza a ser linguaxe.
8. **Sobrerregularización.** Cando extrae unha regra, aplícaa **de máis**: di «*rompido» no
   canto de «roto». Iso non é un retroceso: é a proba de que aprendeu a regra.

---

## 3. A proposta, capa a capa

Cada capa co aparello concreto que a sostén. **Cero cambios de motor**: todo isto existe xa en
`@yggdrasil-forge/core@1.0.0` — cunha excepción que se explica xusto embaixo e que nos custou
media peza do deseño.

### As dúas pistas

> **COMPRENSIÓN 0–100** (continua, decae) e **PRODUCIÓN por rangos** (discreta, son fitos)

A idea era levalas as dúas no propio nodo: `progress` para a primeira, `currentTier` para a segunda.
A produción si vive no motor. A comprensión **non puido**: `setProgress` falla con `NODE_NOT_FOUND`
en calquera nodo creado en runtime, porque o `ProgressManager` gárdase unha copia da `TreeDef` ao
construírse (ver `docs/ACHADOS.md`, achado 7 — o primeiro achado que nos cambiou o deseño).

Rodeo actual: a comprensión e a familiaridade cos sons viven en `EstadoPolitica.familiaridade` e
persístense ao lado do estado do motor; no documento exportado van en `metadata.aCova`. En canto o
motor lea a `TreeDef` do store no momento de usala, isto volve ao seu sitio sen cambiar nada máis.

### Capa 0 — SONS (rexión nova)

Cada fonema que o bebé oe abondo vólvese nodo, con tres rangos: **óeo · distíngueo · sábeo dicir**.
Alimentase de TODA palabra ensinada, mesmo fóra de contexto — así ensinar sen atención deixa de
ser tempo perdido e pasa a ser o que é: darlle sons.

*Aparello: nodos con `maxTier: 3` nunha rexión propia.*

### Capa 1 — ATENCIÓN (substitúe o temporizador de estímulo)

En vez de «o estímulo dura 8 momentos», hai unha **cousa á que se está atendendo**. As accións
póñena; decae soa. Ensinar cunha atención activa liga palabra→referente. Sen atención, a palabra
só baixa á capa 0.

*Aparello: recurso `atencion` + o id do nodo-referente activo na política.*

### Capa 2 — COMPRENSIÓN e PRODUCIÓN separadas

- Cada exposición en contexto sobe a **comprensión**, con rendementos decrecentes. Decae sen
  reforzo.
- A **produción** desbloquéase por rangos, e cada rango pide **dúas cousas**:
  comprensión por riba dun limiar **e** ter os sons necesarios (capa 0).
- Rango 1 = intenta dicila (sae deformada). Rango 2 = recoñecible. Rango 3 = clara.

Resultado: aparece o momento «enténdeo pero aínda non lle sae», que na v1 non existía.

*Aparello: `maxTier` no `NodeDef` para a produción; a comprensión, fóra do motor polo achado 7.*

### Capa 3 — SIGNIFICADO como arestas, con sobreextensión

O significado deixa de ser unha táboa e pasa a ser **o que está debuxado no grafo**: arestas
palabra→referente. Se lle ensinas «can» mirando o gato, «can» gaña unha aresta ao gato. Iso é
sobreextensión, e **vese**: unha palabra con arestas de máis.

Ensinar «gato» diante do gato dispara a **exclusividade mutua** e a política retira a aresta
errada. Na pantalla vese unha mente corrixíndose soa. É a mellor imaxe que pode dar este proxecto.

*Aparello: `add_edge` / `remove_edge` en `applyChanges`.*

### Capa 4 — O ESTOUPIDO

Ao chegar a N palabras comprendidas nace un `keystone` que cambia a economía: a partir de aí unha
soa exposición dá moita máis comprensión.

*Aparello: nodo `keystone` con `tag_count` como prerequisito; a política le se está aceso.*

### Capa 5 — DÚAS PALABRAS (rexión FRASES)

Cando produce N palabras, nace outro `keystone`. A partir de aí, dúas palabras que aparecen xuntas
poden formar un **nodo-frase** que as require (`all`), igual que hoxe fan os conceptos.

### Capa 6 — REGRAS, e o erro que demostra que aprendeu

Cun número abondo de plurais (ou de verbos) nace un nodo-regra. Mentres está aceso, o bebé aplica a
regra **tamén onde non toca** e produce formas incorrectas. As excepcións vanse aprendendo como
nodos propios que a vetan (`exclusions`).

*Aparello: `keystone` + `exclusions`. As exclusións do motor son literalmente «escoller isto veta
aquilo» — a forma regular e a irregular non poden convivir.*

---

## 4. Que se ve na pantalla

- Unha rexión **SONS** que se enche antes ca LINGUAXE. O bebé ten sons antes ca palabras.
- No panel, **dous indicadores** por palabra: unha barra de comprensión que sobe amodo e tres
  chanzos de produción que van saltando.
- O bocadillo di **o que realmente lle sae**: «aua» primeiro, «auga» despois.
- Palabras con arestas de máis (sobreextensión) que se van podando soas.
- Unha rexión **FRASES** que non existe ata que hai palabras abondo.

## 5. O honesto

Segue sen haber grounding e segue sen haber IA. Isto **non é un modelo científico da adquisición
da linguaxe**: é unha caricatura escollida porque as súas etapas dan bo xogo e porque cada unha
delas se pode debuxar nun grafo. As regras están todas nun ficheiro que se pode ler.

## 6. Por onde empezar

Ordenadas por (valor que engaden) ÷ (traballo que custan):

| # | Slice | Que desbloquea | Estado |
| --- | --- | --- | --- |
| A | Capas 0+2: sons + comprensión/produción separadas | O corazón. Aparece a curva e o bebé mispronuncia. | **feito** |
| B | Capa 1: atención conxunta de verdade | Fai que ensinar teña intención, non temporizador. | **feito** |
| C | Capa 3: significado como arestas + sobreextensión | A mellor imaxe do proxecto: a mente corrixíndose. | seguinte |
| D | Capas 4+5: estoupido e dúas palabras | Dá un arco longo á partida. | proposta |
| E | Capa 6: regras e sobrerregularización | O momento «uau», pero é o máis delicado. | proposta |

## 7. Como quedou, medido

Ensinando «auga» sempre coa atención chea, o arco real é este:

| exposición | comprensión | o que lle sae |
| --- | --- | --- |
| 1 | 30% | *(nada: aínda non sabe que significa)* |
| 2 | 54% | `…` — inténtao e non lle sae |
| 3-5 | 72-97% | `aa` — xa ten o /a/ |
| 6-8 | 100% | `aua` — **enténdea enteira e aínda non lle sae** |
| 9 | 100% | `auga` — gañou o /g/ |

Nove exposicións en vez de tres clics, e tres delas no estado que a v1 non sabía representar.

Detalle que houbo que engadir ao probalo: **histérese**. Un rango gáñase ao chegar ao limiar pero só
se perde ao caer 12 puntos por debaixo. Sen ela, o esquecemento quitáballe un punto xusto despois de
gañar o rango e a palabra parpadeaba entre «dío ben» e «vaille esquecendo» a cada momento.
