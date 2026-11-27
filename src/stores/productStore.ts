import { defineStore } from "pinia";
import {
  CatalogNotFoundError,
  getCatalog,
  getProductById,
} from "@/services/catalogService";
import type { Category, Product } from "@/types/Product";

export type ProductSort = "name" | "price-asc" | "price-desc";
export type CategoryFilter = Category | "Todas";
export type CatalogStatus = "idle" | "loading" | "success" | "error";
export type ProductLoadStatus = "idle" | "loading" | "success" | "not-found" | "error";

export interface LoadCatalogOptions {
  force?: boolean;
  maxAgeMs?: number;
}

interface CatalogRequest {
  promise: Promise<Product[]>;
  startedRevision: number;
}

let catalogRequest: CatalogRequest | null = null;
const productRequests = new Map<string, Promise<Product>>();
const productRevisions = new Map<string, number>();
let dataRevision = 0;

function simplify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const useProductStore = defineStore("products", {
  state: () => ({
    products: [] as Product[],
    status: "idle" as CatalogStatus,
    error: null as string | null,
    refreshing: false,
    lastLoadedAt: null as number | null,
    productStatusById: {} as Record<string, ProductLoadStatus>,
    productErrorsById: {} as Record<string, string | null>,
    search: "",
    category: "Todas" as CategoryFilter,
    sortBy: "name" as ProductSort,
  }),

  getters: {
    filteredProducts(state): Product[] {
      const term = simplify(state.search.trim());
      const filtered = state.products.filter((product) => {
        const matchesCategory =
          state.category === "Todas" || product.category === state.category;
        const matchesSearch =
          !term ||
          simplify(
            `${product.name} ${product.description} ${product.category}`,
          ).includes(term);
        return matchesCategory && matchesSearch;
      });

      return filtered.sort((a, b) => {
        if (state.sortBy === "price-asc") return a.price - b.price;
        if (state.sortBy === "price-desc") return b.price - a.price;
        return a.name.localeCompare(b.name, "pt-BR");
      });
    },
  },

  actions: {
    async loadCatalog(options: LoadCatalogOptions = {}): Promise<boolean> {
      const { force = false, maxAgeMs } = options;
      const isFresh = this.status === "success" && this.lastLoadedAt !== null &&
        (maxAgeMs === undefined || Date.now() - this.lastLoadedAt <= maxAgeMs);
      if (!force && isFresh) return true;

      const hadProducts = this.products.length > 0;
      let request = catalogRequest;
      if (!request) {
        this.error = null;
        if (hadProducts) this.refreshing = true;
        else this.status = "loading";

        request = {
          promise: getCatalog(),
          startedRevision: dataRevision,
        };
        catalogRequest = request;
      }

      try {
        const receivedProducts = await request.promise;
        const currentById = new Map(this.products.map((product) => [product.id, product]));
        const receivedIds = new Set(receivedProducts.map((product) => product.id));
        const mergedProducts = receivedProducts.map((product) =>
          (productRevisions.get(product.id) || 0) > request.startedRevision
            ? currentById.get(product.id) || product
            : product,
        );

        for (const product of this.products) {
          if (!receivedIds.has(product.id) &&
            (productRevisions.get(product.id) || 0) > request.startedRevision) {
            mergedProducts.push(product);
          }
        }

        this.products = mergedProducts;
        const revision = ++dataRevision;
        for (const product of mergedProducts) productRevisions.set(product.id, revision);
        this.status = "success";
        this.error = null;
        this.lastLoadedAt = Date.now();
        return true;
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o catálogo.";
        this.status = hadProducts || this.products.length > 0 ? "success" : "error";
        return false;
      } finally {
        if (catalogRequest === request) {
          catalogRequest = null;
          this.refreshing = false;
        }
      }
    },
    async loadProductById(id: string): Promise<Product | null> {
      const productId = id.trim();
      if (!productId) return null;

      this.productStatusById[productId] = "loading";
      this.productErrorsById[productId] = null;

      let request = productRequests.get(productId);
      if (!request) {
        request = getProductById(productId);
        productRequests.set(productId, request);
      }

      try {
        const product = await request;
        const index = this.products.findIndex((candidate) => candidate.id === product.id);
        if (index >= 0) this.products[index] = product;
        else this.products.push(product);

        productRevisions.set(product.id, ++dataRevision);
        this.productStatusById[productId] = "success";
        return product;
      } catch (error) {
        if (error instanceof CatalogNotFoundError) {
          this.products = this.products.filter((product) => product.id !== productId);
          productRevisions.set(productId, ++dataRevision);
          this.productStatusById[productId] = "not-found";
        } else {
          this.productStatusById[productId] = "error";
        }

        this.productErrorsById[productId] =
          error instanceof Error ? error.message : "Não foi possível carregar o produto.";
        return null;
      } finally {
        if (productRequests.get(productId) === request) {
          productRequests.delete(productId);
        }
      }
    },
  },
});
