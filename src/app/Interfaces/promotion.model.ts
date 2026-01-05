export enum PromotionType {
  PERCENTAGE_DISCOUNT = "PERCENTAGE_DISCOUNT",
  FIXED_DISCOUNT = "FIXED_DISCOUNT",
  HAPPY_HOUR = "HAPPY_HOUR",
  TWO_FOR_ONE = "TWO_FOR_ONE",
  FREE_ITEM = "FREE_ITEM",
  FIRST_BOOKING = "FIRST_BOOKING",
  LOYALTY = "LOYALTY"
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  type: PromotionType;
  discountValue?: number;
  fixedPrice?: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  validDays?: string;
  minPeople?: number;
  maxUses?: number;
  currentUses: number;
  promoCode?: string;
  active: boolean;
  featured: boolean;
  restaurant?: any;
}

export interface PromotionCreate {
  title: string;
  description: string;
  type: PromotionType;
  discountValue?: number;
  fixedPrice?: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  validDays?: string;
  minPeople?: number;
  maxUses?: number;
  promoCode?: string;
  active?: boolean;
  featured?: boolean;
}

export interface PromotionUpdate extends Partial<PromotionCreate> {
  active?: boolean;
  featured?: boolean;
}

export interface PromotionTypeConfig {
  label: string;
  icon: string;
  color: string;
}

export const PROMOTION_TYPE_CONFIG: Record<PromotionType, PromotionTypeConfig> = {
  [PromotionType.PERCENTAGE_DISCOUNT]: {
    label: "Porcentaje",
    icon: "bi-percent",
    color: "#8b5cf6"
  },
  [PromotionType.FIXED_DISCOUNT]: {
    label: "Cantidad fija",
    icon: "bi-cash-coin",
    color: "#10b981"
  },
  [PromotionType.HAPPY_HOUR]: {
    label: "Happy Hour",
    icon: "bi-clock-history",
    color: "#f59e0b"
  },
  [PromotionType.TWO_FOR_ONE]: {
    label: "2x1",
    icon: "bi-people-fill",
    color: "#ec4899"
  },
  [PromotionType.FREE_ITEM]: {
    label: "Artículo gratis",
    icon: "bi-gift-fill",
    color: "#06b6d4"
  },
  [PromotionType.FIRST_BOOKING]: {
    label: "Primera reserva",
    icon: "bi-star-fill",
    color: "#eab308"
  },
  [PromotionType.LOYALTY]: {
    label: "Fidelidad",
    icon: "bi-award-fill",
    color: "#a855f7"
  }
};
