class Booking {
  final String id;
  final String tourTitle;
  final String dest;
  final String dates;
  final String status;
  final String voucherId;
  final String price;
  final int totalNumeric;
  final String travelerName;
  final String type; // 'active' | 'completed' | 'cancelled'
  final String startDate;
  final String endDate;
  final String hotelImg;
  final String flight;
  final String airline;
  final int nightsCount;
  final String passport;
  final String phone;
  final int guestsCount;
  final int adultsCount;
  final int childrenCount;
  final String cancellationReason;
  final String travelerId;

  Booking({
    required this.id,
    required this.tourTitle,
    required this.dest,
    required this.dates,
    this.status = 'Tasdiqlangan',
    required this.voucherId,
    required this.price,
    required this.totalNumeric,
    required this.travelerName,
    this.type = 'active',
    this.startDate = '',
    this.endDate = '',
    required this.hotelImg,
    this.flight = 'Charter parvoz',
    this.airline = 'Uzbekistan Airways',
    this.nightsCount = 7,
    this.passport = '',
    this.phone = '',
    this.guestsCount = 2,
    this.adultsCount = 2,
    this.childrenCount = 0,
    this.cancellationReason = '',
    this.travelerId = 'guest',
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    int asInt(dynamic v, int fallback) =>
        v is num ? v.toInt() : int.tryParse(v?.toString() ?? '') ?? fallback;
    String asStr(dynamic v, [String fallback = '']) {
      final s = v?.toString();
      if (s == null || s.isEmpty || s == 'null') return fallback;
      return s;
    }

    final tourTitle = asStr(
      json['tourTitle'] ?? json['title'] ?? json['tour_name'] ?? json['tourName'],
      'Turpaket',
    );
    final dest = asStr(
      json['dest'] ?? json['destination'] ?? json['location'] ?? json['city'],
    );
    final travelerName = asStr(
      json['travelerName'] ??
          json['travellerName'] ??
          json['customerName'] ??
          json['fullName'] ??
          json['name'],
      'Mijoz',
    );
    final voucherId = asStr(
      json['voucherId'] ?? json['voucher'] ?? json['voucherCode'],
      'VCH-${DateTime.now().millisecondsSinceEpoch % 100000}',
    );
    final hotelImg = asStr(
      json['hotelImg'] ?? json['hotelImage'] ?? json['image'] ?? json['img'],
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    );
    final phone = asStr(json['phone'] ?? json['phoneNumber'] ?? json['tel']);
    final passport = asStr(
      json['passport'] ?? json['passportNumber'] ?? json['passport_id'],
    );
    final adults = asInt(json['adultsCount'] ?? json['adults'], 2);
    final children = asInt(json['childrenCount'] ?? json['children'], 0);
    final guests = asInt(
      json['guestsCount'] ?? json['guests'] ?? json['travelersCount'],
      adults + children,
    );

    return Booking(
      id: asStr(json['id'] ?? json['_id'] ?? json['bookingId']),
      tourTitle: tourTitle,
      dest: dest,
      dates: asStr(json['dates'] ?? json['date'] ?? json['travelDates']),
      status: asStr(json['status'], 'Tasdiqlangan'),
      voucherId: voucherId,
      price: asStr(json['price'] ?? json['amountText'], '\$0'),
      totalNumeric: asInt(
        json['totalNumeric'] ?? json['totalPrice'] ?? json['amount'] ?? json['priceNumeric'],
        0,
      ),
      travelerName: travelerName,
      type: asStr(json['type'], 'active'),
      startDate: asStr(json['startDate'] ?? json['checkIn'] ?? json['checkin']),
      endDate: asStr(json['endDate'] ?? json['checkOut'] ?? json['checkout']),
      hotelImg: hotelImg,
      flight: asStr(json['flight'] ?? json['flightInfo'], 'Charter parvoz'),
      airline: asStr(json['airline'], 'Uzbekistan Airways'),
      nightsCount: asInt(json['nightsCount'] ?? json['nights'], 7),
      passport: passport,
      phone: phone,
      guestsCount: guests,
      adultsCount: adults,
      childrenCount: children,
      cancellationReason: asStr(
        json['cancellationReason'] ?? json['cancelReason'] ?? json['reason'],
      ),
      travelerId: asStr(
        json['travelerId'] ?? json['userId'],
        'guest',
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingId': id,
      'travelerId': travelerId,
      'userId': travelerId,
      'tourTitle': tourTitle,
      'title': tourTitle,
      'tourName': tourTitle,
      'dest': dest,
      'destination': dest,
      'location': dest,
      'dates': dates,
      'travelDates': dates,
      'status': status,
      'voucherId': voucherId,
      'voucher': voucherId,
      'price': price,
      'amountText': price,
      'totalNumeric': totalNumeric,
      'totalPrice': totalNumeric,
      'amount': totalNumeric,
      'travelerName': travelerName,
      'travellerName': travelerName,
      'customerName': travelerName,
      'name': travelerName,
      'type': type,
      'startDate': startDate,
      'endDate': endDate,
      'hotelImg': hotelImg,
      'hotelImage': hotelImg,
      'image': hotelImg,
      'flight': flight,
      'airline': airline,
      'nightsCount': nightsCount,
      'nights': nightsCount,
      'passport': passport,
      'passportNumber': passport,
      'phone': phone,
      'phoneNumber': phone,
      'guestsCount': guestsCount,
      'guests': guestsCount,
      'adultsCount': adultsCount,
      'adults': adultsCount,
      'childrenCount': childrenCount,
      'children': childrenCount,
      'cancellationReason': cancellationReason,
      'cancelReason': cancellationReason,
    };
  }
}
