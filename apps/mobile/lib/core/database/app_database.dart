import 'package:drift/drift.dart';

// Tabla local de cumpleaños para consulta instantánea sin conexión
class LocalBirthdays extends Table {
  TextColumn get id => text()();
  TextColumn get circleId => text()();
  TextColumn get fullName => text().withLength(min: 1, max: 150)();
  TextColumn get contactEmail => text().nullable()();
  IntColumn get birthDay => integer()();
  IntColumn get birthMonth => integer()();
  IntColumn get birthYear => integer().nullable()();
  BoolColumn get isMinor => boolean().withDefault(const Constant(false))();
  BoolColumn get isClaimed => boolean().withDefault(const Constant(false))();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

// Tabla local de fotos en caché
class LocalPhotos extends Table {
  TextColumn get id => text()();
  TextColumn get celebrationId => text()();
  TextColumn get secureUrl => text()();
  TextColumn get caption => text().nullable()();
  IntColumn get likesCount => integer().withDefault(const Constant(0))();
  IntColumn get commentsCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
