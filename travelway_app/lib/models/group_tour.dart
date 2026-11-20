class GroupTour {
  final String id;
  final String title;
  final String destination;
  final String country;
  final String departureCity;
  final String departureDate;
  final int nights;
  final int price;
  final int totalSeats;
  final int availableSeats;
  final String img;
  final String description;
  final String status;

  GroupTour({
    required this.id,
    required this.title,
    required this.destination,
    required this.country,
    required this.departureCity,
    required this.departureDate,
    required this.nights,
    required this.price,
    required this.totalSeats,
    required this.availableSeats,
    required this.img,
    required this.description,
    required this.status,
  });

  factory GroupTour.fromJson(Map<String, dynamic> json) {
    return GroupTour(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Guruh sayohati',
      destination: json['destination']?.toString() ?? '',
      country: json['country']?.toString() ?? '',
      departureCity: json['departureCity']?.toString() ?? 'Toshkent',
      departureDate: json['departureDate']?.toString() ?? '',
      nights: (json['nights'] is num) ? (json['nights'] as num).toInt() : 7,
      price: (json['price'] is num) ? (json['price'] as num).toInt() : 0,
      totalSeats: (json['totalSeats'] is num) ? (json['totalSeats'] as num).toInt() : 0,
      availableSeats:
          (json['availableSeats'] is num) ? (json['availableSeats'] as num).toInt() : 0,
      img: json['img']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'open',
    );
  }

  bool get isOpen => status == 'open' && availableSeats > 0;
}