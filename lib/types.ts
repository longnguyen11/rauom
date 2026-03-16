export type DishStatus = "draft" | "scheduled" | "live" | "archived" | "sold_out";
export type DishCategory = "main" | "side" | "dessert" | "bundle";

export type FulfillmentType = "delivery" | "pickup";

export type PaymentMethod = "cash" | "zelle" | "venmo";

export type OrderStatus =
  | "new"
  | "pending_confirmation"
  | "confirmed"
  | "preparing"
  | "completed"
  | "cancelled";

export type KitchenGroup = "cook_now" | "ready_from_prep" | "later";

export interface DishImage {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface DishNutrition {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  sodiumMg: number | null;
  notes: string | null;
}

export interface DishBulkDiscountTier {
  minQuantity: number;
  discountPercent: number;
}

export interface Dish {
  id: string;
  slug: string;
  name: string;
  nameVi?: string | null;
  shortDescription: string;
  shortDescriptionVi?: string | null;
  longDescription: string;
  longDescriptionVi?: string | null;
  category: DishCategory;
  bulkDiscountTiers: DishBulkDiscountTier[];
  priceCents: number;
  currency: string;
  status: DishStatus;
  leadTimeDays: number;
  isFeaturedWeek: boolean;
  isAnchorDish: boolean;
  availableFromUtc: string | null;
  availableToUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  images: DishImage[];
  ingredients: { name: string; isAllergen: boolean }[];
  dietaryTags: { code: string; label: string }[];
  nutrition: DishNutrition | null;
}

export interface Timeslot {
  id: string;
  dateLocal: string;
  startTimeLocal: string;
  endTimeLocal: string;
  startTimeUtc: string;
  endTimeUtc: string;
  slotType: FulfillmentType;
  capacityLimit: number;
  reservedCount: number;
  isOpen: boolean;
  timezone: string;
  minimumLeadTimeDays: number;
}

export interface CartLineInput {
  dishId: string;
  quantity: number;
}

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface CheckoutEstimateInput {
  fulfillmentType: FulfillmentType;
  items: CartLineInput[];
  deliveryAddress?: DeliveryAddress;
}

export interface CheckoutSubmitInput extends CheckoutEstimateInput {
  customerName: string;
  email?: string;
  phone: string;
  notes?: string;
  nextWeekVote?: string;
  paymentMethod: PaymentMethod;
  timeslotId: string;
  turnstileToken?: string;
  idempotencyKey: string;
}

export interface DeliveryQuote {
  distanceMiles: number;
  durationMinutes: number;
  deliveryFeeCents: number;
  distanceSource: string;
  destinationLat?: number;
  destinationLng?: number;
}

export interface OrderEstimate {
  currency: "USD";
  totalItemQuantity: number;
  subtotalCents: number;
  bulkDiscountCents: number;
  earlyOrderDiscountCents: number;
  earlyOrderDiscountPercent: number;
  subtotalAfterDiscountCents: number;
  deliveryFeeCents: number;
  taxRateBps: number;
  taxAmountCents: number;
  totalCents: number;
  leadTimeDays: number;
  maxDishLeadTimeDays: number;
  notes: string[];
  quote?: DeliveryQuote;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  fulfillmentType: FulfillmentType;
  fulfillmentTimeLocal: string;
  createdAtUtc: string;
}

export interface AdminOrderSummary extends OrderSummary {
  customerName: string;
  email: string;
  phone: string;
  paymentMethodSelected: PaymentMethod;
  paymentStatus: "unpaid" | "paid" | "refunded_partial" | "refunded_full";
  kitchenGroup: KitchenGroup;
}
