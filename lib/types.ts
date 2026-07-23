export interface Review {
    id: string;
    name: string;
    rating: number;
    date: string;
    comment: string;
    verified?: boolean;
    userId?:string,
  }
  
  export type ProductSpecification = {
    key: string;
    value: string;
  };
  
  
  export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    images: string[];
    colors: { name: string; price: number | null }[];
    addOns?: { name: string; price: number }[];
    sizes: string[];
    tags: string[];
    stock: number;
    categoryLabel: string;
    rating?: number;
    reviewCount?: number;
    category: string;
    sku: string;
    care: string;
    specifications: ProductSpecification[];
    reviews: Review[];
    createdAt: string;
    updatedAt: string;
    isFeatured:boolean;
    discount: number;
    defaultVariantName?: string;
  }

  export type ProductColumn = {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    isFeatured: boolean;
    createdAt: string;
  };


// types.ts

export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
}

export interface WishlistItem {
  id: string;
  product: WishlistProduct;
}

export interface WishListResponseData {
  wishlistId: string;
  items: WishlistItem[];
}

export interface WishListSuccessResponse {
  success: true;
  data: WishListResponseData;
}

export interface WishListErrorResponse {
  success: false;
  error: string;
}

export type WishListResponse = WishListSuccessResponse | WishListErrorResponse;
export type ParsedWishListData = WishListResponseData; 
