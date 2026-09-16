export interface GtmEcommerceItem {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  currency?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
}

export interface GtmUserData {
  email?: string;
  phone_number?: string;
  address?: {
    first_name?: string;
    last_name?: string;
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  // Meta click-id (see lib/meta-fbc.ts). Not used by Google Ads
  // Enhanced Conversions — carried here so a GTM Data Layer Variable can
  // pick it up for the Facebook Pixel tag's Advanced Matching, once that
  // variable is wired up in the GTM container.
  fbc?: string;
}

export interface GtmPurchasePayload {
  transaction_id: string;
  order_id?: string;
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: GtmEcommerceItem[];
  user_data?: GtmUserData;
}

export interface GtmRemoveFromCartPayload {
  value?: number;
  currency?: string;
  items: GtmEcommerceItem[];
}

export interface GtmAddToCartPayload {
  value?: number;
  currency?: string;
  items: GtmEcommerceItem[];
}

export interface GtmBeginCheckoutPayload {
  value?: number;
  currency?: string;
  coupon?: string;
  items: GtmEcommerceItem[];
}

export interface GtmViewItemPayload {
  value?: number;
  currency?: string;
  items: GtmEcommerceItem[];
}
