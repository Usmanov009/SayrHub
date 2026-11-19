"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconPlaceholder } from "@/admin/dashboard/icon-placeholder"
import type { Booking, TourPackage } from "@/types"
import {
  AdminUser,
  calculateTourAdminFinancials,
  isBookingForAdmin,
} from "@/admin/adminTypes"

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function SectionCards({
  bookings,
  usersCount,
  currentAdmin,
  tours = [],
  staffList = [],
}: {
  bookings: Booking[]
  usersCount: number
  currentAdmin?: AdminUser | null
  tours?: TourPackage[]
  staffList?: AdminUser[]
}) {
  const isTourAdmin = currentAdmin?.role === "tour_admin"

  // 1. Calculations for Tour Admin
  const myBookings = isTourAdmin
    ? bookings.filter((b) => isBookingForAdmin(b, currentAdmin, tours))
    : bookings
  const myPaidBookings = myBookings.filter(
    (booking) => booking.status !== "Bekor qilingan"
  )
  const myGrossRevenue = myPaidBookings.reduce(
    (total, booking) => total + (Number(booking.totalNumeric) || 0),
    0
  )
  const { commissionFee, netRevenue } =
    calculateTourAdminFinancials(myGrossRevenue)
  const myActiveBookings = myPaidBookings.filter(
    (booking) =>
      booking.type === "active" ||
      booking.status === "Tasdiqlangan" ||
      booking.status === "Jarayonda"
  ).length

  // 2. Calculations for Main Admin (Bosh Admin)
  const paidBookings = bookings.filter(
    (booking) => booking.status !== "Bekor qilingan"
  )
  const totalPlatformRevenue = paidBookings.reduce(
    (total, booking) => total + (Number(booking.totalNumeric) || 0),
    0
  )
  const activeBookings = paidBookings.filter(
    (booking) => booking.type === "active"
  ).length

  // Calculate 3% commission from tour admin sales
  const tourAdminBookings = paidBookings.filter((b) => {
    if (b.adminId && b.adminId !== "adm-root") return true
    const tour = tours.find(
      (t) =>
        t.id === b.tourId ||
        (t.title &&
          b.tourTitle &&
          t.title.trim().toLowerCase() === b.tourTitle.trim().toLowerCase())
    )
    if (tour && tour.adminId && tour.adminId !== "adm-root") return true
    return false
  })
  const tourAdminsRevenue =
    tourAdminBookings.length > 0
      ? tourAdminBookings.reduce(
          (sum, b) => sum + (Number(b.totalNumeric) || 0),
          0
        )
      : totalPlatformRevenue
  const totalTourAdminsCommission = Math.round(tourAdminsRevenue * 0.03)

  // Growth calculation
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const inRange = (booking: Booking, from: Date, to?: Date) => {
    const date = new Date(booking.createdAt || booking.startDate || "")
    if (Number.isNaN(date.getTime())) return false
    return date >= from && (!to || date < to)
  }

  const currentMonthBookings = myPaidBookings.filter((booking) =>
    inRange(booking, monthStart)
  )
  const previousMonthBookings = myPaidBookings.filter((booking) =>
    inRange(booking, previousMonthStart, monthStart)
  )

  const revenueGrowth = percentChange(
    currentMonthBookings.reduce(
      (total, booking) => total + (Number(booking.totalNumeric) || 0),
      0
    ),
    previousMonthBookings.reduce(
      (total, booking) => total + (Number(booking.totalNumeric) || 0),
      0
    )
  )
  const bookingGrowth = percentChange(
    currentMonthBookings.length,
    previousMonthBookings.length
  )

  const TrendIcon = revenueGrowth >= 0 ? "TrendingUpIcon" : "TrendingDownIcon"

  return (
    <div className="space-y-4">
      {/* Role-Specific Overview Alert Banner */}
      {isTourAdmin ? (
        <div className="mx-4 lg:mx-6 rounded-2xl bg-linear-to-r from-indigo-500/10 via-cyan-500/10 to-emerald-500/10 p-4 border border-indigo-200/60 dark:border-indigo-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <IconPlaceholder lucide="ShieldCheckIcon" className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  Tur Admin Moliyaviy Boshqaruvi
                </h4>
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 text-[10px]"
                >
                  3% Komissiya Sharti
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                O‘z turlaringiz bo‘yicha jami tushumdan 3% Bosh Adminga
                to‘lanadi. 97% sof daromad sizning hisobingizda qoladi.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-background border border-border text-foreground shadow-2xs">
              Jami tushum: <b>${money.format(myGrossRevenue)}</b>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shadow-2xs">
              Bosh adminga 3%: <b>${money.format(commissionFee)}</b>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 shadow-2xs">
              Sof daromad: <b>${money.format(netRevenue)}</b>
            </span>
          </div>
        </div>
      ) : (
        <div className="mx-4 lg:mx-6 rounded-2xl bg-linear-to-r from-amber-500/10 via-indigo-500/10 to-primary/10 p-4 border border-amber-200/60 dark:border-amber-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <IconPlaceholder lucide="Crown" className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  Bosh Admin: To‘liq Boshqaruv & Platforma Daromadlari
                </h4>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px]"
                >
                  Yagona Super Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Barcha tizim funksiyalari, mijozlar shaxsiy ma’lumotlari va Tur
                Adminlardan tushadigan 3% komissiya tushumlari to‘liq sizga
                tegishli.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-background border border-border text-foreground shadow-2xs">
              Umumiy aylanma: <b>${money.format(totalPlatformRevenue)}</b>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 shadow-2xs">
              Tur adminlardan 3%: <b>${money.format(totalTourAdminsCommission)}</b>
            </span>
          </div>
        </div>
      )}

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {isTourAdmin ? (
          <>
            {/* 1. Tour Admin: O'z daromadi */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>O‘z daromadingiz (Jami tushum)</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  ${money.format(myGrossRevenue)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    <IconPlaceholder lucide={TrendIcon} />
                    {revenueGrowth >= 0 ? "+" : ""}
                    {revenueGrowth}%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Sizning turlaringiz bo‘yicha{" "}
                  <IconPlaceholder lucide={TrendIcon} className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Tasdiqlangan va faol bronlar umumiy summasi
                </div>
              </CardFooter>
            </Card>

            {/* 2. Tour Admin: Bosh adminga 3% to'lov */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Bosh adminga 3% to‘lov</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-rose-600 dark:text-rose-400">
                  ${money.format(commissionFee)}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant="outline"
                    className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                  >
                    3% Komissiya
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium text-rose-600 dark:text-rose-400">
                  Daromaddan 3% hisoblandi
                </div>
                <div className="text-muted-foreground">
                  SayrHub Bosh Adminiga to‘lanishi kerak bo‘lgan ulush
                </div>
              </CardFooter>
            </Card>

            {/* 3. Tour Admin: Sof daromad (97%) */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Sof daromad (97%)</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-emerald-600 dark:text-emerald-400">
                  ${money.format(netRevenue)}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  >
                    97% Sizda qoladi
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  3% to‘lovdan keyingi qoldiq
                </div>
                <div className="text-muted-foreground">
                  Tur admin hisobiga o‘tadigan sof foyda
                </div>
              </CardFooter>
            </Card>

            {/* 4. Tour Admin: Faol buyurtmalar */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Faol buyurtmalar</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {money.format(myActiveBookings)} ta
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <IconPlaceholder lucide="TrendingUpIcon" />
                    {money.format(myPaidBookings.length)} jami
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Sizning faol sayohatchilaringiz
                </div>
                <div className="text-muted-foreground">
                  O‘z turlaringiz bo‘yicha jarayondagi bronlar
                </div>
              </CardFooter>
            </Card>
          </>
        ) : (
          <>
            {/* 1. Main Admin: Umumiy tushum */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Umumiy tushum (Platforma)</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  ${money.format(totalPlatformRevenue)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <IconPlaceholder lucide={TrendIcon} />
                    {revenueGrowth >= 0 ? "+" : ""}
                    {revenueGrowth}%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Shu oyda o‘sish tendensiyasi{" "}
                  <IconPlaceholder lucide={TrendIcon} className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Barcha tur adminlar va yo‘nalishlar bo‘yicha aylanma
                </div>
              </CardFooter>
            </Card>

            {/* 2. Main Admin: Tur adminlardan 3% komissiya */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Tur adminlardan 3% komissiya</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-indigo-600 dark:text-indigo-400">
                  ${money.format(totalTourAdminsCommission)}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                  >
                    3% sof komissiya
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium text-indigo-600 dark:text-indigo-400">
                  Platforma sof daromadi
                </div>
                <div className="text-muted-foreground">
                  Tur adminlar savdosidan Bosh Adminga to‘lanadigan 3%
                </div>
              </CardFooter>
            </Card>

            {/* 3. Main Admin: Mijozlar bazasi (Faqat Bosh Admin) */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Mijozlar bazasi (Faqat Bosh Admin)</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {money.format(usersCount)}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  >
                    Bosh Admin
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {bookingGrowth >= 0 ? "Bu davrda o‘sish" : "Bu davrda pasayish"}{" "}
                  <IconPlaceholder lucide={TrendIcon} className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Ro‘yxatdan o‘tgan barcha mijozlar (tur adminlarga ko‘rinmaydi)
                </div>
              </CardFooter>
            </Card>

            {/* 4. Main Admin: Faol bronlar */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Faol bronlar</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {money.format(activeBookings)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <IconPlaceholder lucide="TrendingUpIcon" />
                    {money.format(paidBookings.length)} jami
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Jami tizim bo‘yicha{" "}
                  <IconPlaceholder lucide="TrendingUpIcon" className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Barcha adminlar bo‘yicha tasdiqlangan bronlar
                </div>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
