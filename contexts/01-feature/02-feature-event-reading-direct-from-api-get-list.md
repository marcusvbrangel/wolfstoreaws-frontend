# 01 - Eventos com leitura atualizada da API de catálogo

## Status

Implementada e validada em 26/11/2026.

## Contexto

A integração inicial já executa:

```text
App.vue
  -> productStore.loadCatalog()
  -> catalogService.getCatalog()
  -> GET /catalog
```

Depois da primeira carga, a aplicação trabalha com a Pinia. Em uma sessão
longa, preço, estoque e disponibilidade podem ficar desatualizados.

Endpoints disponíveis no AWS SAM:

```text
GET /catalog       -> CatalogResponse { products, count }
GET /catalog/{id}  -> Catalog
```

Fonte: [base-wolfstore-catalog-backend](https://github.com/marcusvbrangel/base-wolfstore-catalog-backend), branch [01-feature/get-list-static-catalog](https://github.com/marcusvbrangel/base-wolfstore-catalog-backend/tree/01-feature/get-list-static-catalog).

## Objetivo

Atualizar o catálogo nos momentos relevantes da jornada, mantendo a API como
origem e `productStore` como única fonte de verdade interna.

Views e componentes não chamarão `fetch` nem `catalogService` diretamente.

```text
Evento da interface
  -> action da productStore
  -> catalogService
  -> GET /catalog ou GET /catalog/{id}
  -> atualização de productStore.products
  -> consumidores reativos
```

## Eventos incluídos

### 1. Abrir detalhes

Ao entrar em `/produto/:id`:

```text
GET /catalog/{id}
```

A resposta atualizará ou inserirá o produto em `productStore.products`. A view
continuará lendo somente a store e distinguirá loading, sucesso, `404` e erro.

### 2. Adicionar ao carrinho

Antes de adicionar pelo catálogo ou detalhes:

```text
GET /catalog/{id}
  -> atualizar produto na store
  -> validar estoque
  -> adicionar
```

Produto inexistente ou sem estoque não será adicionado.

### 3. Abrir o carrinho

Ao entrar em `/carrinho`:

```text
GET /catalog
  -> substituir catálogo na store
  -> cartStore.reconcileWithCatalog()
```

A reconciliação removerá IDs inexistentes, limitará quantidades e recalculará
preços e totais.

### 4. Abrir o checkout

Ao entrar em `/checkout`:

```text
GET /catalog
  -> reconcileWithCatalog()
  -> exibir checkout atualizado
```

Itens indisponíveis ou quantidades ajustadas deverão ser informados ao usuário.

### 5. Confirmar o pedido simulado

Imediatamente antes da criação local:

```text
GET /catalog
  -> reconcileWithCatalog()
  -> verificar carrinho não vazio
  -> criar pedido simulado
```

Isso reduz dados antigos, mas não substitui um backend transacional de pedidos.

## Eventos que permanecem locais

Não farão chamada HTTP:

- pesquisa, categoria e ordenação;
- “Mostrar mais produtos”;
- toast e interações visuais;
- formatação de moeda e data.

Esses eventos continuarão operando sobre `productStore.products`.

## Alterações implementadas

### `catalogService.ts`

- adicionado `getProductById(id)`;
- reutilizadas validação e normalização de produto;
- ID codificado na URL;
- `404` diferenciado das demais falhas.

### `productStore.ts`

- atualização forçada ou condicionada por idade do catálogo;
- action de carregamento por ID com deduplicação de requisições;
- atualização de produto sem duplicidade;
- estados de loading/erro da lista e do produto;
- store preservada como único estado exposto às views.

### `cartStore.ts`

- reconciliação somente após atualização bem-sucedida;
- retorno de itens removidos ou quantidades ajustadas;
- carrinho preservado quando a API falha.

### Views

- `ProductDetailsView` solicita produto ao abrir ou mudar ID;
- catálogo e detalhes atualizam antes de adicionar;
- `CartView` atualiza e reconcilia ao abrir;
- `CheckoutView` atualiza ao abrir e antes de confirmar.

## Concorrência e falhas

- evitar chamadas simultâneas equivalentes;
- não repetir a carga inicial ao montar a primeira view;
- desabilitar adição enquanto o produto é validado;
- impedir resposta antiga de sobrescrever resposta recente;
- erro de atualização não apagará o último catálogo válido;
- erro de produto não adicionará dados antigos ao carrinho;
- `404` exibirá “Produto não encontrado”;
- rede/servidor permitirão nova tentativa.

## Fora do escopo

- API de carrinho e pedidos;
- reserva transacional de estoque;
- autenticação, pagamento e tempo real.

## Critérios de aceite

1. Detalhes consulta `GET /catalog/{id}`.
2. Adicionar atualiza o produto antes de alterar o carrinho.
3. Carrinho consulta `GET /catalog` e reconcilia ao abrir.
4. Checkout atualiza e reconcilia ao abrir.
5. Confirmação atualiza antes de criar o pedido local.
6. Views e componentes não acessam o serviço diretamente.
7. `productStore.products` continua sendo o único estado de produtos.
8. Pesquisa, categoria, ordenação e paginação visual continuam locais.
9. Falha não destrói o último catálogo válido.
10. Produto `404` não é adicionado.
11. Não há chamadas duplicadas para o mesmo evento.
12. `npm run typecheck` e `npm run build` passam.

## Validação manual

- proxy confirmou lista com 60 itens e `GET /catalog/P006`;
- alterar preço/estoque no backend e reabrir detalhes;
- adicionar um produto com estoque atualizado;
- abrir carrinho e conferir uma atualização da lista;
- remover produto no backend e validar reconciliação;
- abrir checkout e conferir preços/quantidades;
- desligar o SAM e validar erro sem perder o último catálogo;
- proxy confirmou `404` para o ID válido inexistente `P999`.

Validação automatizada concluída: `npm run typecheck` e `npm run build`.

## Resultado esperado

Os pontos críticos consultarão o catálogo atualizado sem espalhar acesso HTTP.
A Pinia organizará o estado da UI e o backend será a origem comercial.
