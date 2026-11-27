# Wolf Store - contexto técnico durável

> Leia este arquivo antes de trabalhar no projeto. Ele foi produzido após a
> leitura do repositório completo, do código-fonte, dos dados, dos assets
> representativos, do lockfile, da documentação e da apostila em PDF.

## 1. Snapshot e fonte de verdade

- Snapshot analisado em: **2026-11-26** (`America/Sao_Paulo`).
- Branch observada: `01-feature/initial-integration-with-backend-catalog`.
- Commit observado: `74d7412a20d2d4a132ea00536978a6dd1432f5a1`
  (`feat: update product component`).
- O código-fonte atual é a fonte de verdade. A apostila em `docs/` é uma
  explicação extensa e útil, mas descreve o ZIP que originou o projeto e já tem
  pequenas divergências em relação ao repositório atual.
- Não há `AGENTS.md` no projeto. `.agents/`, `.codex/`, `.aws/` e `contexts/`
  estavam sem arquivos no momento da leitura; `.vscode/settings.json` existe,
  mas `.vscode/` é ignorada pelo Git.

### Divergências já conhecidas entre apostila e repositório

- A apostila afirma que o ZIP não tinha `package-lock.json`; o repositório atual
  tem lockfile v3 versionado.
- A apostila referencia a edição/base de 21/11/2026; este snapshot é de
  26/11/2026 e contém commits posteriores.
- As versões declaradas usam intervalos com `^`. No ambiente analisado estavam
  resolvidas: Vue `3.5.46`, Pinia `3.0.4`, Vue Router `4.6.5`, Vite `6.4.6`,
  TypeScript `5.9.3`, `@vitejs/plugin-vue` `5.2.4`, `vue-tsc` `2.2.12` e
  `@types/node` `22.20.5`.

## 2. Resumo executivo

Wolf Store é uma SPA didática de e-commerce. Usa Vue 3, TypeScript, Pinia, Vue
Router e Vite e possui uma integração inicial de leitura com um catálogo AWS
SAM local. Não há autenticação, pedido remoto, banco acessado diretamente pelo
frontend, pagamento ou entrega real.

O sistema possui:

- 5 páginas: catálogo, detalhes, carrinho, checkout e confirmação;
- 5 componentes reutilizáveis: cabeçalho, rodapé, card de produto, item do
  carrinho e resumo do pedido;
- 3 stores Pinia: produtos/filtros, carrinho e pedidos;
- 60 produtos fictícios carregados do endpoint `/catalog`, 15 por categoria;
- 60 ilustrações SVG locais, mais a marca/favIcon;
- persistência de carrinho e pedidos em `localStorage`;
- layout responsivo sem biblioteca visual externa;
- checkout e pagamentos estritamente simulados.

O projeto é pequeno e direto: há somente um serviço HTTP para o catálogo e não
há composables, testes automatizados, lint configurado, SSR ou framework full
stack. Essa simplicidade é intencional no estado atual.

## 3. Stack, execução e build

### Dependências declaradas

- Runtime: `vue`, `pinia`, `vue-router`.
- Desenvolvimento: `typescript`, `vite`, `@vitejs/plugin-vue`, `vue-tsc`,
  `@types/node`.
- Requisito: Node.js 20 ou superior.
- Módulos ESM (`"type": "module"`).

### Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

`./iniciar.sh` verifica Node/npm, instala dependências quando `node_modules/`
não existe e inicia o servidor Vite em `127.0.0.1`.

Em desenvolvimento, o backend AWS SAM deve responder em
`http://127.0.0.1:3000/catalog`. O Vite encaminha `/api/catalog` para esse
endpoint. `VITE_CATALOG_API_URL` pode substituir a URL usada pelo frontend.

### Estado verificado neste snapshot

- `npm run typecheck`: passou sem erros.
- `npm run build`: passou sem erros com Vite `6.4.6`.
- Build observado após a integração: 60 módulos transformados; CSS ~21,52 kB e JS ~130,60 kB
  antes de gzip.
- Não há suíte de testes automatizados nem scripts `test`/`lint`.
- `dist/`, `node_modules/`, logs e `.vscode/` são ignorados pelo Git.

## 4. Arquitetura e inicialização

Fluxo de bootstrap:

```text
index.html (#app)
  -> src/main.ts
     -> createApp(App)
     -> registra Pinia
     -> registra Vue Router
     -> importa main.css
     -> monta em #app
        -> App.vue
           -> AppHeader
           -> carrega o catálogo e reconcilia o carrinho
           -> loading/erro ou RouterView
           -> AppFooter
```

O alias `@` aponta para `src/` tanto no Vite quanto no TypeScript. O alvo do
TypeScript é ES2022, com `strict`, `isolatedModules`, resolução `Bundler` e
`noEmit`.

O router usa `createWebHistory()`. Em hospedagem estática, toda rota desconhecida
no servidor deve ser reescrita para `index.html`; sem isso, atualizar diretamente
`/produto/N001`, `/checkout` ou `/pedido/...` causará 404 no hosting.

### Rotas

| Caminho | View | Papel |
|---|---|---|
| `/` | `CatalogView.vue` | Busca, filtros, ordenação e listagem |
| `/produto/:id` | `ProductDetailsView.vue` | Detalhe e adição ao carrinho |
| `/carrinho` | `CartView.vue` | Quantidades, remoção e resumo |
| `/checkout` | `CheckoutView.vue` | Formulário e criação local do pedido |
| `/pedido/:id` | `ConfirmationView.vue` | Confirmação do pedido persistido |
| qualquer outra | redireciona para `/` | Fallback interno da SPA |

Após cada navegação, o router atualiza o título para
`<meta.title> | Wolf Store`. O `scrollBehavior` restaura posição salva, evita
mudar a rolagem na mesma rota e sobe ao topo ao trocar de rota.

## 5. Modelo de domínio

### Produto

`Product` contém `id`, `name`, `description`, `category`, `price`, `stock`,
`imageUrl` e `tag?`. As categorias permitidas são `Notebooks`, `Monitores`,
`Periféricos` e `Smartphones`.

`CartEntry` persiste apenas `{ productId, quantity }`. `CartLine` combina todos
os dados de `Product` com `quantity` para apresentação e snapshot do pedido.

### Pedido

`Order` guarda:

- ID e data de criação;
- cliente (`name`, `email`, `phone`);
- endereço completo;
- método `pix`, `cartao` ou `boleto`;
- itens como snapshots de `CartLine`;
- subtotal, frete, total;
- status literal `SIMULATED`.

Valores monetários são números em reais, sem uma abstração específica de
centavos. Isso é aceitável para a demonstração, mas não deve ser reutilizado
acriticamente em um backend financeiro.

## 6. Catálogo e assets

`GET /catalog` é a única origem runtime dos produtos. A resposta contém 60
objetos; `src/data/products.ts` permanece apenas como referência histórica e
não é importado pela aplicação:

- Backend: [base-wolfstore-catalog-backend](https://github.com/marcusvbrangel/base-wolfstore-catalog-backend)
- Branch de origem: [01-feature/get-list-static-catalog](https://github.com/marcusvbrangel/base-wolfstore-catalog-backend/tree/01-feature/get-list-static-catalog)

| Prefixo | Categoria | IDs | Quantidade |
|---|---|---|---:|
| `N` | Notebooks | `N001` a `N015` | 15 |
| `M` | Monitores | `M001` a `M015` | 15 |
| `P` | Periféricos | `P001` a `P015` | 15 |
| `S` | Smartphones | `S001` a `S015` | 15 |

Cada `imageUrl` aponta para `/assets/products/<id-em-minúsculas>.svg`. Os 60
arquivos correspondentes existem em `public/assets/products/`, medem 520x420,
incluem `role="img"` e `aria-label` coerente com o produto. `public/assets/wolf-mark.svg`
e `public/favicon.svg` contêm a mesma marca vetorial. `preview-produtos.png`
é uma prancha visual de amostras; não participa do runtime.

Os SVGs são assets estáticos detalhados, não componentes Vue. O backend deve
retornar IDs e `imageUrl` compatíveis com esses arquivos. Assets em `public/`
são servidos a partir de `/`, portanto os caminhos não incluem `/public`.

## 7. Stores e regras de negócio atuais

### `productStore`

Estado:

- `products`: única lista carregada da API;
- `status`: `idle`, `loading`, `success` ou `error`;
- `error`: mensagem da última falha;
- `search`: texto de busca;
- `category`: uma categoria ou `Todas`;
- `sortBy`: `name`, `price-asc` ou `price-desc`.

`loadCatalog()` chama exclusivamente `catalogService`, compartilha requisições
simultâneas, aceita atualização forçada/por idade e preserva o último catálogo
se uma atualização falhar. O serviço valida resposta, count, campos, categorias
e IDs duplicados, além de normalizar `tag: null`.

`loadProductById()` consulta `GET /catalog/{id}`, atualiza ou insere o produto na
mesma lista e trata `404` separadamente. Respostas individuais mais recentes não
são sobrescritas por uma listagem iniciada anteriormente.

O getter `filteredProducts`:

1. remove espaços externos do termo;
2. normaliza texto com NFD, remove diacríticos e converte para minúsculas;
3. filtra por categoria e por ocorrência em nome + descrição + categoria;
4. ordena por preço ou por nome em `pt-BR`.

O `filter()` cria um novo array antes do `sort()`, então o array-fonte não é
ordenado in-place.

### `cartStore`

Chave persistida: `wolf-store:cart:v1`.

Na inicialização, `loadCartEntries()` aceita entradas estruturais com ID textual
e quantidade inteira positiva. Depois da API carregar, `reconcileWithCatalog()`
remove IDs inexistentes, elimina itens sem estoque, combina duplicados e limita
quantidades ao estoque remoto.

Getters:

- `detailedItems`: junta cada entrada persistida à `productStore`;
- `itemCount`: soma unidades, não apenas linhas;
- `subtotal`: soma `price * quantity` com preços atuais do catálogo;
- `shipping`: zero para carrinho vazio ou subtotal >= R$ 299; senão R$ 24,90;
- `total`: subtotal + frete.

Actions:

- `addItem(product)`: adiciona uma unidade e respeita estoque;
- `setQuantity(id, value)`: arredonda para baixo, remove em `<= 0` e limita ao
  estoque;
- `removeItem(id)` e `clearCart()`;
- todas as mutações persistem imediatamente.

`addItem` e `setQuantity` voltam a localizar o produto na `productStore`, de
modo que preço e estoque nunca são lidos de uma cópia estática.

### `orderStore`

Chave persistida: `wolf-store:orders:v1`.

`loadOrders()` somente confirma que o JSON é um array; não valida a estrutura
interna de cada pedido. `createOrder()` gera `WS-` + os oito primeiros caracteres
de `crypto.randomUUID()` em maiúsculas, define timestamp ISO, fixa
`status: 'SIMULATED'`, insere no início e salva todo o array. `findOrder()` faz
busca exata por ID.

Pedidos não são alterados nem removidos pela interface. Como contêm cliente e
endereço, o próprio README orienta usar dados fictícios.

## 8. Fluxos de tela

### Catálogo

- A aplicação mostra loading global enquanto consulta a API e erro com retry se
  a carga falhar.
- Mostra 12 produtos inicialmente e acrescenta 12 por clique.
- Mudanças em busca, categoria ou ordenação restauram o limite para 12.
- Categorias exibem contadores; busca é tolerante a acentos.
- Adicionar mostra toast por 2,4 s e limpa o timer ao desmontar a view.
- Estado vazio permite limpar filtros.

### Detalhes

- Consulta o produto por ID ao abrir ou mudar a rota.
- Exibe loading, erro com retry e “produto não encontrado” para `404`.
- Revalida o produto antes de adicionar ao carrinho.

### Carrinho

- Atualiza a lista e reconcilia os itens ao abrir, sem duplicar a carga inicial
  recém-concluída.
- Renderiza `CartItem` para cada linha e `CartSummary` para totais.
- Permite incrementar, decrementar, remover e esvaziar.
- Quantidade máxima desabilita o botão `+`.
- Carrinho vazio tem CTA para o catálogo.

### Checkout

- Atualiza/reconcilia ao abrir e força nova validação antes de confirmar.
- Se a reconciliação mudar o carrinho, interrompe a criação para nova revisão.
- Só exibe o formulário se houver itens.
- Usa validação HTML nativa: nome mínimo 3, email, CEP com 8 dígitos (hífen
  opcional), UF com duas letras e campos obrigatórios.
- Telefone e complemento são opcionais; não há máscaras nem validação de
  domínio.
- `finishOrder()` captura snapshots de itens e totais, cria o pedido, limpa o
  carrinho e substitui a rota pela confirmação.
- `saving` evita reentrada síncrona, mas não representa operação remota.

### Confirmação

- Busca o pedido no `localStorage` por ID.
- Mostra data, cliente, pagamento, itens e total.
- Se a origem/localStorage mudar ou for limpa, o pedido deixa de ser encontrado.

## 9. Componentes e comunicação

- `AppHeader`: usa diretamente `cartStore.itemCount`; marca e links principais.
- `AppFooter`: aviso explícito de demonstração e ano calculado no render.
- `ProductCard`: recebe `product` por prop e emite `add(product)`; não conhece a
  store do carrinho.
- `CartItem`: recebe `CartLine` e emite `quantity(id, quantity)` e `remove(id)`;
  não muta a store diretamente.
- `CartSummary`: consulta a store diretamente e, opcionalmente, mostra link para
  checkout.

O projeto combina dois estilos válidos: componentes de apresentação emitem
eventos, enquanto componentes globais/de resumo leem stores diretamente.

## 10. UI, responsividade e acessibilidade observada

`src/assets/main.css` é o único stylesheet e implementa todo o design system.
Predominam navy/azul/ciano, superfícies claras, bordas suaves e cards. Não há
Tailwind, CSS modules, Sass ou biblioteca de componentes.

Breakpoints:

- acima de 1170 px: grade de 4 colunas;
- até 1170 px: 3 colunas;
- até 850 px: 2 colunas; carrinho/checkout viram uma coluna;
- até 560 px: ajustes móveis extensos, mantendo 2 colunas compactas de produtos.

Há `:focus-visible`, labels, `aria-label`, `aria-live` no toast, estados vazios,
texto alternativo nas imagens e suporte a `prefers-reduced-motion`. Pontos que
merecem auditoria futura, se acessibilidade virar requisito formal: contraste
dos textos pequenos, navegação completa por leitor de tela, semântica do
controle de quantidade, anúncio de erros nativos do formulário e tamanho de
alvos em telas pequenas.

## 11. Arquivos e responsabilidades

| Arquivo/pasta | Responsabilidade |
|---|---|
| `README.md` | Execução, funcionalidades, estrutura e avisos |
| `index.html` | Documento inicial, metadados e `#app` |
| `package.json` / lockfile | Scripts, dependências e resolução reproduzível |
| `vite.config.ts` | Plugin Vue, alias `@` e proxy local do catálogo |
| `tsconfig.json` | TypeScript estrito e alias |
| `iniciar.sh` | Conveniência de execução Linux |
| `src/main.ts` | Bootstrap Vue + Pinia + Router + CSS |
| `src/App.vue` | Shell persistente da SPA |
| `src/router/index.ts` | Rotas, títulos e scroll |
| `src/types/` | Contratos `Product`, carrinho e `Order` |
| `src/services/catalogService.ts` | Fetch, validação e normalização do catálogo |
| `src/data/products.ts` | Referência histórica, fora do runtime |
| `src/stores/` | Estado, regras e persistência local |
| `src/components/` | Componentes reutilizáveis |
| `src/views/` | Cinco páginas roteadas |
| `src/utils/format.ts` | Moeda BRL e data `pt-BR` |
| `src/assets/main.css` | Estilo global e responsivo |
| `public/assets/` | Marca e 60 ilustrações de produto |
| `docs/*.pdf` | Apostila técnica de 49 páginas |
| `preview-produtos.png` | Prancha visual fora do runtime |

## 12. Invariantes que mudanças futuras devem preservar

- O ID do produto deve continuar único e compatível com a rota e o asset.
- Quantidade do carrinho deve ser inteira, positiva e limitada ao estoque.
- Itens desconhecidos ou inválidos no carrinho persistido devem ser descartados.
- Totais e frete nunca devem ser aceitos como verdade por um backend futuro.
- Um pedido confirmado deve guardar snapshot dos itens/totais, não apenas IDs.
- A interface deve continuar dizendo claramente que a versão atual é simulada
  enquanto não houver operação real.
- Se `createWebHistory()` for mantido, o deploy precisa de fallback SPA.
- Mudança das chaves ou formatos do `localStorage` exige migração/versionamento.
- O alias `@` deve permanecer consistente entre Vite e TypeScript.
- O backend é a única origem de produtos; nenhum consumidor chama a API fora
  da `productStore` por meio do serviço.
- IDs e URLs retornados pelo catálogo devem corresponder aos assets locais.

## 13. Limitações e riscos conhecidos

- O catálogo tem backend, mas estoque, frete e pedido ainda podem ser
  manipulados no browser e não são transacionais.
- Sem autenticação/autorização e sem contas de usuário.
- Dados de checkout ficam em texto claro no `localStorage` da origem.
- `orderStore` não valida pedidos carregados em runtime.
- `localStorage.setItem()` pode lançar erro (quota, bloqueio); as actions de
  persistência não tratam essa falha.
- O catálogo é carregado integralmente da API e toda busca posterior é em memória.
- A disponibilidade inicial da aplicação depende do endpoint de catálogo.
- Carrinho e checkout também dependem de atualizações do catálogo; falhas
  preservam o último estado válido, mas bloqueiam a confirmação sem validação.
- Não há testes unitários, de componentes ou E2E.
- Não há lint/formatador configurado no projeto, embora o VS Code ignorado
  aponte para Prettier.
- Rotas não usam lazy loading; todas as views entram no bundle inicial.
- `createWebHistory()` depende de configuração correta do host.
- Validação do checkout é apenas HTML/browser, adequada à simulação e
  insuficiente para dados não confiáveis.
- Não existe tratamento formal de migração dos dados `v1`.

Esses itens são contexto, não autorização automática para refatorar. Preserve a
simplicidade atual salvo quando a tarefa pedir evolução.

## 14. Integração AWS Serverless

A primeira etapa da evolução foi implementada para o catálogo:

```text
Vue/Pinia
  -> fetch HTTPS usando VITE_API_BASE_URL
  -> API Gateway
  -> Lambda
  -> DynamoDB
```

Próximas evoluções possíveis:

- validação de preço/estoque/frete no servidor;
- idempotência e autorização para criar pedidos;
- observabilidade e tratamento de falhas;
- regras de rewrite do hosting para a SPA;
- testes automatizados do contrato e dos fluxos.

Componentes, contratos e rotas foram preservados; a store já não importa o
array estático.

## 15. Checklist antes e depois de alterar

Antes:

1. Ler este contexto e os arquivos diretamente envolvidos.
2. Conferir `git status` e preservar mudanças do usuário.
3. Identificar se a tarefa altera formato persistido, rota ou contrato.
4. Tratar o código atual, não a apostila, como fonte de verdade.

Depois:

1. Rodar `npm run typecheck`.
2. Rodar `npm run build`.
3. Para mudanças de fluxo, testar manualmente catálogo -> detalhe -> carrinho ->
   checkout -> confirmação, inclusive estados vazios e IDs inválidos.
4. Verificar desktop e breakpoints de 850/560 px para alterações visuais.
5. Atualizar este arquivo se arquitetura, dados persistidos, comandos, rotas,
   dependências ou limitações tiverem mudado.

## 16. Roteiro manual de referência

- Confirmar 60 produtos e 15 por categoria.
- Buscar com e sem acentos e limpar filtros.
- Ordenar por nome e preços; carregar 12/24/... itens.
- Abrir `/produto/N001` e um ID inválido.
- Adicionar até o estoque máximo; recarregar e confirmar persistência.
- Verificar frete R$ 24,90 abaixo de R$ 299 e grátis a partir de R$ 299.
- Decrementar a zero, remover e esvaziar carrinho.
- Abrir checkout vazio.
- Testar CEP/UF inválidos e depois criar pedido com dados fictícios.
- Confirmar que o carrinho é limpo e o pedido `WS-...` é exibido.
- Limpar `wolf-store:orders:v1` e confirmar o estado “não encontrado”.

---

Este documento é a memória persistente do projeto, não um substituto para ler
o código modificado. Atualize o snapshot quando houver mudanças substanciais.
