import { describe, it, expect } from 'vitest';
import {
  calculateTourAdminFinancials,
  isBookingForAdmin,
  isTourOwnedByAdmin,
  AdminUser,
} from '../src/admin/adminTypes';
import type { Booking, TourPackage } from '../src/types';

describe('Admin Roles & 2% Tax System', () => {
  const mainAdmin: AdminUser = {
    id: 'adm-root',
    name: 'Bosh Admin',
    username: 'admin',
    email: 'admin@sayrhub.uz',
    role: 'main_admin',
    roleTitle: 'Bosh Admin (Super)',
    avatar: '',
    phone: '+998901234567',
    canManageUsers: true,
    canManageStaff: true,
    canDeleteTours: true,
    canEditFinancials: true,
    canManageBookings: true,
    canManageCatalog: true,
    createdAt: '2026-01-01',
    lastActive: '2026-01-01',
    status: 'active',
  };

  const tourAdmin1: AdminUser = {
    id: 'adm-tour-1',
    name: 'Ali Turayev',
    username: 'tur_ali',
    email: 'tur_ali@sayrhub.uz',
    role: 'tour_admin',
    roleTitle: 'Tur Admin',
    avatar: '',
    phone: '+998907654321',
    assignedDestinations: ['Turkiya', 'Antalya'],
    canManageUsers: false,
    canManageStaff: false,
    canDeleteTours: true,
    canEditFinancials: false,
    canManageBookings: true,
    canManageCatalog: true,
    createdAt: '2026-02-01',
    lastActive: '2026-02-01',
    status: 'active',
  };

  const sampleTour: TourPackage = {
    id: 'tour-101',
    title: 'Antalya Deluxe Resort',
    country: 'Turkiya',
    resort: 'Antalya',
    location: 'Turkiya, Antalya',
    tag: 'All Inclusive',
    badgeType: 'ultra',
    is5Star: true,
    rating: 4.9,
    nights: '7 kecha',
    flight: 'HY-271',
    price: 1000,
    img: '/img/tour.jpg',
    saved: false,
    category: 'AI',
    adminId: 'adm-tour-1',
    adminUsername: 'tur_ali',
  };

  const sampleBooking: Booking = {
    id: 'b-201',
    tourId: 'tour-101',
    adminId: 'adm-tour-1',
    adminUsername: 'tur_ali',
    tourTitle: 'Antalya Deluxe Resort',
    dest: 'Turkiya, Antalya',
    dates: '10 iyun — 17 iyun',
    status: 'Tasdiqlangan',
    voucherId: 'V-1001',
    price: '$2000',
    totalNumeric: 2000,
    travelerName: 'Sardor Aliyev',
    type: 'active',
  };

  describe('2% Tax Calculation', () => {
    it('calculates 2% tax to main admin and 98% net revenue correctly', () => {
      const gross = 10000;
      const result = calculateTourAdminFinancials(gross);

      expect(result.grossRevenue).toBe(10000);
      expect(result.commissionPercent).toBe(2);
      expect(result.commissionFee).toBe(200); // 2% of 10,000 = 200
      expect(result.netRevenue).toBe(9800);    // 98% of 10,000 = 9800
    });

    it('handles $0 revenue gracefully', () => {
      const result = calculateTourAdminFinancials(0);
      expect(result.grossRevenue).toBe(0);
      expect(result.commissionFee).toBe(0);
      expect(result.netRevenue).toBe(0);
    });

    it('correctly rounds small commission values', () => {
      const result = calculateTourAdminFinancials(750);
      // 750 * 0.02 = 15
      expect(result.commissionFee).toBe(15);
      expect(result.netRevenue).toBe(735);
    });
  });

  describe('Admin Permissions & Attribution', () => {
    it('main admin has access to all tours and bookings', () => {
      expect(isTourOwnedByAdmin(sampleTour, mainAdmin)).toBe(true);
      expect(isBookingForAdmin(sampleBooking, mainAdmin, [sampleTour])).toBe(true);
    });

    it('tour admin owns tours created with their adminId or assigned destinations', () => {
      expect(isTourOwnedByAdmin(sampleTour, tourAdmin1)).toBe(true);

      const unassignedTour: TourPackage = {
        ...sampleTour,
        id: 'tour-102',
        country: 'Misr',
        resort: 'Sharm El-Sheikh',
        location: 'Misr, Sharm El-Sheikh',
        adminId: 'adm-other',
        adminUsername: 'tur_other',
      };
      expect(isTourOwnedByAdmin(unassignedTour, tourAdmin1)).toBe(false);
    });

    it('tour admin matches bookings for their tours or adminId', () => {
      expect(isBookingForAdmin(sampleBooking, tourAdmin1, [sampleTour])).toBe(true);

      const otherBooking: Booking = {
        ...sampleBooking,
        id: 'b-202',
        tourId: 'tour-999',
        adminId: 'adm-other',
        adminUsername: 'tur_other',
        dest: 'Dubay, BAA',
        tourTitle: 'Dubay Marina Hotel',
      };
      expect(isBookingForAdmin(otherBooking, tourAdmin1, [sampleTour])).toBe(false);
    });

    it('tour admin role cannot manage users or staff', () => {
      expect(tourAdmin1.canManageUsers).toBe(false);
      expect(tourAdmin1.canManageStaff).toBe(false);
      expect(mainAdmin.canManageUsers).toBe(true);
      expect(mainAdmin.canManageStaff).toBe(true);
    });
  });
});
