export enum PromotionType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
  TWO_FOR_ONE = "TWO_FOR_ONE",
  FREE_ITEM = "FREE_ITEM"
}

export interface Promotion {
  id: number;
  restaurantId: number;
  restaurantName?: string;
  title: string;
  description: string;
  type: PromotionType;
  discountValue?: number;
  minimumOrder?: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  featured: boolean;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PromotionCreate {
  restaurantId: number;
  title: string;
  description: string;
  type: PromotionType;
  discountValue?: number;
  minimumOrder?: number;
  validFrom: string;
  validUntil: string;
  maxUsage?: number;
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
  [PromotionType.PERCENTAGE]: {
    label: "Porcentaje",
    icon: "bi-percent",
    color: "#8b5cf6"
  },
  [PromotionType.FIXED]: {
    label: "Cantidad fija",
    icon: "bi-cash-coin",
    color: "#10b981"
  },
  [PromotionType.TWO_FOR_ONE]: {
    label: "2x1",
    icon: "bi-people-fill",
    color: "#f59e0b"
  },
  [PromotionType.FREE_ITEM]: {
    label: "Artículo gratis",
    icon: "bi-gift-fill",
    color: "#ec4899"
  }
};
