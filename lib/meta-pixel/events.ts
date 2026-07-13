export type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"

export interface PageViewParams {
  content_ids?: string[]
  content_type?: string
}

export interface ViewContentParams {
  content_ids?: string[]
  content_type?: string
  content_name?: string
  content_category?: string
  content_section?: string
  value?: number
  currency?: string
}

export interface SearchParams {
  search_string?: string
  content_ids?: string[]
  content_type?: string
}

export interface AddToCartParams {
  content_ids?: string[]
  content_type?: string
  content_name?: string
  content_category?: string
  value?: number
  currency?: string
  quantity?: number
}

export interface InitiateCheckoutParams {
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
  num_items?: number
  contents?: ContentItem[]
}

export interface AddPaymentInfoParams {
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
}

export interface PurchaseParams {
  value: number
  currency: string
  order_id?: string
  content_ids?: string[]
  content_type?: string
  contents?: ContentItem[]
  quantity?: number
}

export interface LeadParams {
  value?: number
  currency?: string
}

export interface CompleteRegistrationParams {
  status?: string
  value?: number
  currency?: string
}

export interface ContentItem {
  id: string
  quantity: number
  item_price?: number
}

export type EventParams = {
  PageView: PageViewParams
  ViewContent: ViewContentParams
  Search: SearchParams
  AddToCart: AddToCartParams
  InitiateCheckout: InitiateCheckoutParams
  AddPaymentInfo: AddPaymentInfoParams
  Purchase: PurchaseParams
  Lead: LeadParams
  CompleteRegistration: CompleteRegistrationParams
}

export type AnyEventParams = Record<string, unknown>

export interface TrackEventOptions {
  disableDeduplication?: boolean
  /**
   * Explicit event ID for browser↔server deduplication. When the same
   * event is also sent via the Conversions API with this id, Meta collapses
   * the two into one. For Purchase we pass the order id.
   */
  eventId?: string
}

export interface AttributionData {
  pixelId: string
  pageName: string
  campaign?: string
  timestamp: number
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

export interface DebugPayload {
  type: "attribution" | "event" | "init" | "error" | "storage"
  data: unknown
}

export const EVENT_NAMES: MetaEventName[] = [
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "CompleteRegistration",
]
