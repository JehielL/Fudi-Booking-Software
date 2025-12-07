import { BookingStatus } from './booking-status.model';

export interface DashboardStats {
  todayBookings: number;
  todayPeople: number;
  pendingBookings: number;
  monthlyConfirmed: number;
  averageRating: number;
  totalReviews: number;
}

export interface DashboardBooking {
  id: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  date: string;
  time: string;
  partySize: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
}

export interface DashboardMonthlyStats {
  month: string;
  totalBookings: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  noShow: number;
  totalPeople: number;
}

export interface DashboardQuickStats {
  todayBookings: number;
  todayPeople: number;
  pendingBookings: number;
  monthlyConfirmed: number;
}

export interface DashboardTodayBooking {
  id: number;
  userName: string;
  time: string;
  partySize: number;
  status: BookingStatus;
  specialRequests?: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  pendingBookings: DashboardBooking[];
  todayBookings: DashboardBooking[];
  monthlyStats: DashboardMonthlyStats[];
}
