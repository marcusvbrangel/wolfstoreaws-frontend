import type { Category, Product } from "@/types/Product";

const CATALOG_URL =
  import.meta.env.VITE_CATALOG_API_URL?.trim() || "/api/catalog";
const CATEGORIES: readonly Category[] = [
  "Notebooks",
  "Monitores",
  "Periféricos",
  "Smartphones",
];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(
  product: UnknownRecord,
  field: string,
  index: number,
): string {
  const value = product[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Produto ${index + 1}: campo "${field}" inválido.`);
  }
  return value;
}

function parseProduct(value: unknown, index: number): Product {
  if (!isRecord(value)) {
    throw new Error(`Produto ${index + 1}: estrutura inválida.`);
  }

  const category = readString(value, "category", index);
  if (!CATEGORIES.includes(category as Category)) {
    throw new Error(
      `Produto ${index + 1}: categoria "${category}" não reconhecida.`,
    );
  }

  if (
    typeof value.price !== "number" ||
    !Number.isFinite(value.price) ||
    value.price < 0
  ) {
    throw new Error(`Produto ${index + 1}: campo "price" inválido.`);
  }

  if (
    typeof value.stock !== "number" ||
    !Number.isInteger(value.stock) ||
    value.stock < 0
  ) {
    throw new Error(`Produto ${index + 1}: campo "stock" inválido.`);
  }

  if (
    value.tag !== null &&
    value.tag !== undefined &&
    typeof value.tag !== "string"
  ) {
    throw new Error(`Produto ${index + 1}: campo "tag" inválido.`);
  }

  const product: Product = {
    id: readString(value, "id", index),
    name: readString(value, "name", index),
    description: readString(value, "description", index),
    category: category as Category,
    price: value.price,
    stock: value.stock,
    imageUrl: readString(value, "imageUrl", index),
  };

  if (typeof value.tag === "string" && value.tag.trim() !== "") {
    product.tag = value.tag;
  }

  return product;
}
async function readJson(
  response: Response,
  invalidJsonMessage: string,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(invalidJsonMessage);
  }
}

export class CatalogNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Produto "${productId}" não encontrado.`);
    this.name = "CatalogNotFoundError";
  }
}

export async function getCatalog(): Promise<Product[]> {
  const response = await fetch(CATALOG_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar o catálogo (HTTP ${response.status}).`);
  }

  const payload = await readJson(
    response,
    "O backend retornou um catálogo que não é JSON válido.",
  );

  if (!isRecord(payload) || !Array.isArray(payload.products)) {
    console.log(
      "Falha ao carregar o catálogo: " + JSON.stringify(response, null, 2),
    );
    alert("Falha ao carregar o catálogo: " + JSON.stringify(response, null, 2));
    throw new Error("O backend retornou um catálogo com estrutura inválida.");
  }

  if (
    !Number.isInteger(payload.count) ||
    payload.count !== payload.products.length
  ) {
    throw new Error(
      "A quantidade informada pelo backend não corresponde à lista de produtos.",
    );
  }

  const products = payload.products.map(parseProduct);
  const ids = new Set(products.map((product) => product.id));
  if (ids.size !== products.length) {
    throw new Error("O backend retornou produtos com IDs duplicados.");
  }

  return products;
}

export async function getProductById(id: string): Promise<Product> {
  const productId = id.trim();
  if (!productId) throw new Error("O ID do produto é obrigatório.");

  const response = await fetch(
    `${CATALOG_URL.replace(/\/$/, "")}/${encodeURIComponent(productId)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (response.status === 404) {
    throw new CatalogNotFoundError(productId);
  }

  if (!response.ok) {
    throw new Error(`Falha ao carregar o produto (HTTP ${response.status}).`);
  }

  const payload = await readJson(
    response,
    "O backend retornou um produto que não é JSON válido.",
  );
  const product = parseProduct(payload, 0);
  if (product.id !== productId) {
    throw new Error("O backend retornou um produto diferente do solicitado.");
  }

  return product;
}
