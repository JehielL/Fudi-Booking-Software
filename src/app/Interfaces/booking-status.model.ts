export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  NO_SHOW = "NO_SHOW"
}

export interface BookingStatusConfig {
  icon: string;
  text: string;
  color: string;
  bgClass: string;
  textClass: string;
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, BookingStatusConfig> = {
  [BookingStatus.PENDING]: {
    icon: "bi-hourglass-split",
    text: "Pendiente",
    color: "yellow",
    bgClass: "bg-warning-soft",
    textClass: "text-warning-dark"
  },
  [BookingStatus.CONFIRMED]: {
    icon: "bi-check-circle-fill",
    text: "Confirmada",
    color: "green",
    bgClass: "bg-success-soft",
    textClass: "text-success-dark"
  },
  [BookingStatus.COMPLETED]: {
    icon: "bi-trophy-fill",
    text: "Completada",
    color: "blue",
    bgClass: "bg-info-soft",
    textClass: "text-info-dark"
  },
  [BookingStatus.CANCELLED]: {
    icon: "bi-x-circle-fill",
    text: "Cancelada",
    color: "red",
    bgClass: "bg-danger-soft",
    textClass: "text-danger-dark"
  },
  [BookingStatus.REJECTED]: {
    icon: "bi-slash-circle-fill",
    text: "Rechazada",
    color: "red",
    bgClass: "bg-danger-soft",
    textClass: "text-danger-dark"
  },
  [BookingStatus.NO_SHOW]: {
    icon: "bi-person-x-fill",
    text: "No asistió",
    color: "gray",
    bgClass: "bg-secondary-soft",
    textClass: "text-secondary-dark"
  }
};
