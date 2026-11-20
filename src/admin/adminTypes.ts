import { TourPackage, Booking, PriceAlert, ComboTour, FlightTicket, HotelOnly, UserProfile } from '../types';

export type AdminRole = 'main_admin' | 'tour_admin';

export interface AdminUser {
  id: string;
  name: string;
  username?: string;
  password?: string;
  email: string;
  role: AdminRole;
  roleTitle: string; // 'Bosh Admin (Super)' | 'Tur Admin (Operatsion)'
  avatar: string;
  phone: string;
  assignedDestinations?: string[]; // e.g. ['Turkiya', 'BAA', 'Misr', 'Tailand']
  canManageUsers: boolean; // only main_admin
  canManageStaff: boolean; // only main_admin
  canDeleteTours: boolean; // main_admin has full delete, tour_admin can archive
  canEditFinancials: boolean; // only main_admin
  canManageBookings: boolean; // both
  canManageCatalog: boolean; // both
  createdAt: string;
  lastActive: string;
  status: 'active' | 'suspended';
}

export type AdminTab = 
  | 'dashboard'
  | 'tours'
  | 'combo'
  | 'groups'
  | 'flights'
  | 'hotels'
  | 'bookings'
  | 'users'
  | 'staff'
  | 'price_alerts'
  | 'settings';

export interface AdminStats {
  totalTours: number;
  totalCombo: number;
  totalFlights: number;
  totalHotels: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenueUSD: number;
  totalUsers: number;
  activePriceAlerts: number;
  kompasOnlineConnected: boolean;
}

/**
 * 3% Platform Commission percentage paid to Bosh Admin by Tour Admins
 */
export const TOUR_ADMIN_COMMISSION_PERCENT = 3;

export function calculateTourAdminFinancials(grossRevenue: number) {
  const commissionFee = Math.round(grossRevenue * (TOUR_ADMIN_COMMISSION_PERCENT / 100));
  const netRevenue = Math.max(0, grossRevenue - commissionFee);
  return {
    grossRevenue,
    commissionPercent: TOUR_ADMIN_COMMISSION_PERCENT,
    commissionFee, // Bosh adminga 3% to'lanadigan pul
    netRevenue,    // Tur adminning 97% sof daromadi
  };
}

/**
 * Check if a tour belongs to a specific admin.
 * Main admin owns/supervises everything.
 */
export function isTourOwnedByAdmin(tour: TourPackage, admin: AdminUser | null | undefined): boolean {
  if (!admin || admin.role === 'main_admin') return true;
  if (tour.adminId && tour.adminId === admin.id) return true;
  if (tour.adminUsername && admin.username && tour.adminUsername.toLowerCase() === admin.username.toLowerCase()) return true;
  if (Array.isArray(admin.assignedDestinations) && admin.assignedDestinations.length > 0) {
    const loc = (tour.location || tour.country || '').toLowerCase();
    if (admin.assignedDestinations.some(d => loc.includes(d.toLowerCase()))) return true;
  }
  return false;
}

/**
 * Check if a booking belongs to a specific admin.
 * Main admin sees everything.
 */
export function isBookingForAdmin(
  booking: Booking,
  admin: AdminUser | null | undefined,
  tours: TourPackage[] = []
): boolean {
  if (!admin || admin.role === 'main_admin') return true;
  if (booking.adminId && booking.adminId === admin.id) return true;
  if (booking.adminUsername && admin.username && booking.adminUsername.toLowerCase() === admin.username.toLowerCase()) return true;

  // Match by tour ID or tour Title
  const tour = tours.find(t => t.id === booking.tourId || (t.title && booking.tourTitle && t.title.trim().toLowerCase() === booking.tourTitle.trim().toLowerCase()));
  if (tour) {
    if (tour.adminId === admin.id) return true;
    if (tour.adminUsername && admin.username && tour.adminUsername.toLowerCase() === admin.username.toLowerCase()) return true;
  }

  // Match by assigned destinations
  if (Array.isArray(admin.assignedDestinations) && admin.assignedDestinations.length > 0) {
    const dest = (booking.dest || '').toLowerCase();
    const title = (booking.tourTitle || '').toLowerCase();
    if (admin.assignedDestinations.some(d => dest.includes(d.toLowerCase()) || title.includes(d.toLowerCase()))) {
      return true;
    }
  }

  return false;
}
