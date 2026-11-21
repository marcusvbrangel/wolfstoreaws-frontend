# 🐺 Wolf Store

Loja virtual **Vue 3 + TypeScript + Vite + Pinia + Vue Router**, 100% local, com design responsivo. Este é um projeto funcional de demonstração — **não depende de AWS ou de qualquer backend**.

## Como executar (Ubuntu / Linux / Windows / macOS)

**Requisito:** Node.js 20 ou superior e npm. É preciso conexão com a internet **somente na primeira instalação das dependências**.

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

- **60 produtos fictícios**, sendo **15 Notebooks, 15 Monitores, 15 Periféricos e 15 Smartphones**.
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
│   ├── data/products.ts         # TODOS os 60 produtos definidos explicitamente
│   ├── router/index.ts          # Rotas das telas
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

**Todos os produtos, preços, estoque, pagamentos, fretes e pedidos são fictícios.** O sistema não cobra dinheiro, não cria pedidos reais, não registra usuários, não utiliza cookies de rastreamento e não envia informações para servidores. Evite preencher o checkout com seus dados pessoais verdadeiros: eles ficarão salvos localmente no navegador como parte do pedido simulado.

O catálogo está inteiro em `src/data/products.ts`. Para modificar um item, basta editar seu objeto. As imagens são SVG e podem ser abertas como arquivos de texto ou em um navegador. O CSS é tradicional, em um único arquivo de fácil inspeção, e não há chamadas de API.

Se quiser começar com carrinho e pedidos vazios, limpe os dados locais do site no navegador (Application/Storage → Local Storage, procure as chaves `wolf-store:cart:v1` e `wolf-store:orders:v1`).

Para uma futura versão AWS Serverless, o frontend poderá passar a consultar produtos e pedidos em endpoints do API Gateway, sem exigir reescrever as telas.
