export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  tags: string[];
  popularityScore: number;
  isActive: boolean;
};
