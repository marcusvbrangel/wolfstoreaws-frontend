# 🐺 Wolf Store

Loja virtual **Vue 3 + TypeScript + Vite + Pinia + Vue Router**, com design responsivo e integração inicial com um catálogo AWS Serverless executado localmente.

## Como executar (Ubuntu / Linux / Windows / macOS)

**Requisitos:** Node.js 20 ou superior, npm e o backend AWS SAM respondendo em `http://127.0.0.1:3000/catalog`.

### Origem do catálogo

- Backend: [base-wolfstore-catalog-backend](https://github.com/marcusvbrangel/base-wolfstore-catalog-backend)
- Branch integrada: [01-feature/get-list-static-catalog](https://github.com/marcusvbrangel/base-wolfstore-catalog-backend/tree/01-feature/get-list-static-catalog)

Antes de iniciar o frontend, confirme o catálogo:

```bash
curl -sS http://127.0.0.1:3000/catalog
```

```bash
cd wolf-store
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente **http://127.0.0.1:5173/**.

No Ubuntu/Linux, você também pode executar `./iniciar.sh`; ele instala as dependências na primeira execução e inicia a loja.

### Build de produção

```bash
npm run build
npm run preview
```

O comando `npm run build` também executa a checagem de tipos do Vue/TypeScript. Os arquivos gerados ficam em `dist/`.

## Funcionalidades já implementadas

- **60 produtos fictícios carregados da API de catálogo**, sendo **15 Notebooks, 15 Monitores, 15 Periféricos e 15 Smartphones**.
- Estado único de produtos na store Pinia, com carregamento, erro e nova tentativa.
- Atualização por ID nos detalhes/adição e revalidação da lista no carrinho e checkout.
- **60 ilustrações SVG locais e exclusivas**, uma por produto, em `public/assets/products/`. Não são fotos de produtos reais nem dependem de URLs externas.
- Filtro por categoria, pesquisa por nome/descrição, ordenação alfabética/menor preço/maior preço.
- Catálogo com 12 itens por vez e botão **Mostrar mais produtos**.
- Página de detalhes de cada produto.
- Carrinho com adicionar, remover, aumentar/diminuir quantidade, total e frete fictício.
- Carrinho preservado pelo `localStorage` após atualizar a página.
- Checkout com formulário, opções PIX/cartão/boleto **inteiramente simuladas**.
- Confirmação do pedido com número, data, itens e total.
- Pedidos fictícios preservados no `localStorage` do próprio navegador.
- Layout responsivo para desktop, tablet e celular.

## Onde estão os arquivos

```text
wolf-store/
├── public/
│   ├── favicon.svg
│   └── assets/
│       ├── wolf-mark.svg
│       └── products/            # 60 imagens .svg
├── src/
│   ├── assets/main.css          # Estilo completo, sem biblioteca de UI
│   ├── components/              # Header, Footer, ProductCard, CartItem e CartSummary
│   ├── data/products.ts         # Referência histórica; não participa do runtime
│   ├── router/index.ts          # Rotas das telas
│   ├── services/                # Cliente e validação do contrato do catálogo
│   ├── stores/                  # Stores Pinia: produtos, carrinho e pedidos
│   ├── types/                   # Tipos TypeScript simples
│   ├── utils/format.ts          # Moeda e data em pt-BR
│   ├── views/                   # Catálogo, Produto, Carrinho, Checkout, Confirmação
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── vite.config.ts
└── iniciar.sh
```

## Observações importantes

**Todos os produtos, preços, estoque, pagamentos, fretes e pedidos são fictícios.** O frontend consulta o serviço local somente para obter o catálogo. O sistema não cobra dinheiro, não cria pedidos reais no backend, não registra usuários e não utiliza cookies de rastreamento. Evite preencher o checkout com seus dados pessoais verdadeiros: eles ficam no `localStorage` como parte do pedido simulado.

O endpoint é a única origem dos produtos e `productStore.products` é a única fonte de verdade interna. `src/services/catalogService.ts` valida o contrato e normaliza `tag: null`. Em desenvolvimento, o Vite encaminha `/api/catalog` para o AWS SAM e evita CORS. O arquivo `src/data/products.ts` não é importado pela aplicação.

Se quiser começar com carrinho e pedidos vazios, limpe os dados locais do site no navegador (Application/Storage → Local Storage, procure as chaves `wolf-store:cart:v1` e `wolf-store:orders:v1`).

A integração atual cobre somente a leitura do catálogo. Pedidos, estoque transacional, autenticação e pagamentos continuam fora do backend.
