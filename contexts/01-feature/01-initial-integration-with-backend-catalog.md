# 01 - Integração inicial com o backend de catálogo

## Status

Implementada e validada em 26/11/2026.

## Objetivo

Substituir o catálogo estático pelo catálogo do backend AWS SAM local:

```text
GET http://127.0.0.1:3000/catalog
```

Fonte: [base-wolfstore-catalog-backend](https://github.com/marcusvbrangel/base-wolfstore-catalog-backend), branch [01-feature/get-list-static-catalog](https://github.com/marcusvbrangel/base-wolfstore-catalog-backend/tree/01-feature/get-list-static-catalog).

Contrato esperado:

```json
{
  "products": [
    {
      "id": "N001",
      "name": "Notebook Wolf Air 14",
      "description": "Tela 14” Full HD · 8 GB RAM · SSD 256 GB",
      "category": "Notebooks",
      "price": 3299,
      "stock": 12,
      "imageUrl": "/assets/products/n001.svg",
      "tag": "Novidade"
    }
  ],
  "count": 60
}
```

## Decisão arquitetural

A API será a única origem dos produtos. `productStore.products` será a única
fonte de verdade interna consumida pela aplicação.

```text
AWS SAM: GET /catalog
          ↓
catalogService.ts
          ↓
productStore.products
          ↓
Catálogo, detalhes, carrinho, checkout e confirmação
```

Nenhum componente ou outra store poderá:

- importar `src/data/products.ts`;
- chamar `/catalog` diretamente;
- manter uma cópia paralela dos produtos;
- usar produtos estáticos como fallback silencioso.

## Contrato e normalização

`CatalogResponse` contém `products` e `count`. Cada produto contém `id`, `name`,
`description`, `category`, `price`, `stock`, `imageUrl` e `tag`.

- `price` chega como número JSON, embora tenha origem em `BigDecimal` no Java;
- `stock` deve ser inteiro;
- `tag` pode ser texto ou `null`;
- `tag: null` deverá ser normalizado para `undefined`, ou o tipo TypeScript
  deverá aceitar explicitamente `null`;
- categorias e estrutura mínima da resposta deverão ser validadas em runtime.

## Implementação

### 1. Serviço HTTP

`src/services/catalogService.ts` foi criado para:

- executar a requisição;
- verificar `response.ok`;
- interpretar e validar `CatalogResponse`;
- normalizar o DTO para `Product`;
- retornar `Promise<Product[]>`.

O serviço não manterá estado e será chamado somente pela `productStore`.

### 2. Store de produtos

`src/stores/productStore.ts` removeu o catálogo estático e passou a manter:

```ts
products: Product[]
status: 'idle' | 'loading' | 'success' | 'error'
error: string | null
```

`loadCatalog()` é responsável por:

1. impedir carregamentos simultâneos ou duplicados;
2. marcar `loading`;
3. consultar `catalogService`;
4. atribuir o resultado a `products`;
5. marcar `success` ou registrar `error`.

Busca, categoria e ordenação continuarão operando sobre o mesmo estado.

### 3. Inicialização central

`App.vue` dispara `productStore.loadCatalog()` na inicialização. A carga não
fica restrita ao catálogo, pois rotas diretas de
detalhes, carrinho e checkout também dependem dos produtos.

A interface distinguirá `idle`, carregamento, sucesso, lista vazia e erro. O
erro deverá permitir nova tentativa.

### 4. Carrinho

`cartStore.ts` não importa mais `src/data/products.ts`. O carrinho continua
persistindo apenas `{ productId, quantity }`.

Após o catálogo carregar, `cartStore` usará `productStore.products` para:

- montar `detailedItems`;
- validar IDs persistidos;
- limitar quantidades ao estoque;
- calcular subtotal, frete e total.

O carrinho não poderá excluir itens enquanto o catálogo estiver apenas vazio
por ainda estar carregando.

### 5. Catálogo estático

`src/data/products.ts` deixará de participar do runtime. Poderá permanecer
temporariamente como referência ou rollback, mas não será importado nem usado
como fallback.

## Desenvolvimento local e CORS

O frontend e o SAM usam origens diferentes. `curl` não aplica CORS, mas o
navegador aplica. Configurar proxy no Vite:

```text
Frontend: /api/catalog
Vite:     http://127.0.0.1:3000/catalog
```

Em produção, a URL deverá vir de variável de ambiente e o API Gateway deverá
fornecer os cabeçalhos CORS adequados.

## Arquivos alterados

- criado `src/services/catalogService.ts`;
- alterados `src/stores/productStore.ts` e `src/stores/cartStore.ts`;
- alterados `src/App.vue`, `src/env.d.ts`, `src/assets/main.css` e `vite.config.ts`;
- atualizados `README.md` e os contextos do projeto.

## Fora do escopo inicial

- autenticação, autorização e pagamento;
- criação de pedidos ou atualização de estoque no backend;
- cache persistente ou fallback local do catálogo;
- paginação do backend;
- deploy do frontend ou backend.

## Critérios de aceite

1. Existe uma única requisição controlada para carregar `/catalog`.
2. Os 60 produtos da API aparecem no catálogo.
3. Busca, filtro, ordenação e “mostrar mais” continuam funcionando.
4. Detalhes, carrinho e checkout usam `productStore.products`.
5. Não existe importação runtime de `src/data/products.ts`.
6. Nenhum consumidor fora da store, por meio do serviço, chama a API.
7. O carrinho persiste e é reconciliado após o catálogo carregar.
8. Produto removido do backend não quebra o carrinho.
9. Estoque e preço exibidos são os retornados pela API.
10. Falhas mostram erro compreensível e permitem tentar novamente.
11. Não existe fallback silencioso para dados estáticos.
12. `npm run typecheck` e `npm run build` passam.

## Validação manual

- iniciar SAM e confirmar `/catalog` com `count: 60`;
- proxy Vite validado com 60 produtos, de `N001` a `S015`;
- testar filtros, ordenação, busca e carregamento incremental;
- acessar diretamente `/produto/N001`;
- adicionar produto, recarregar e validar o carrinho;
- concluir um pedido simulado;
- desligar o SAM e testar erro + nova tentativa;
- retornar JSON inválido e confirmar tratamento seguro.

Validação automatizada concluída: `npm run typecheck` e `npm run build`.

## Resultado esperado

O backend será a única origem do catálogo e `productStore.products` será o
único estado de produtos consumido pela Wolf Store.
