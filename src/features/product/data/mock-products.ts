import type { Product } from "@/features/product/types/product.types";

export const mockProducts: Product[] = [
  {
    id: "product-iphone-15-128",
    slug: "iphone-15-128gb",
    name: "iPhone 15 128GB",
    brand: "Apple",
    category: "Smartphones",
    description: "Modelo canônico para agregação de ofertas em marketplaces diferentes.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    tags: ["apple", "smartphone", "ios", "128gb"],
    popularityScore: 98,
    isActive: true
  },
  {
    id: "product-galaxy-s24-256",
    slug: "galaxy-s24-256gb",
    name: "Galaxy S24 256GB",
    brand: "Samsung",
    category: "Smartphones",
    description: "Produto com múltiplas ofertas para comparação por preço, frete e loja.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
    tags: ["samsung", "android", "smartphone", "256gb"],
    popularityScore: 94,
    isActive: true
  },
  {
    id: "product-air-fryer-55l",
    slug: "air-fryer-digital-55l",
    name: "Air Fryer Digital 5,5L",
    brand: "Philco",
    category: "Casa e Cozinha",
    description: "Exemplo de item de casa com forte apelo comercial em comparadores.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1585515656615-3bdb785f1d80?auto=format&fit=crop&w=1200&q=80",
    tags: ["air fryer", "cozinha", "eletroportatil"],
    popularityScore: 88,
    isActive: true
  },
  {
    id: "product-robot-vacuum-x10",
    slug: "robo-aspirador-x10",
    name: "Robo Aspirador X10",
    brand: "Wap",
    category: "Casa Inteligente",
    description: "Base pronta para futuras features como histórico de preço e alertas.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1200&q=80",
    tags: ["casa inteligente", "limpeza", "automacao"],
    popularityScore: 81,
    isActive: true
  }
];
