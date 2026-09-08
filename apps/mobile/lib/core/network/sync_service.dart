import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SyncService {
  final String baseUrl;
  final _storage = const FlutterSecureStorage();

  SyncService({this.baseUrl = 'http://10.0.2.2:4000/api'});

  Future<void> executeDeltaSync() async {
    final token = await _storage.read(key: 'jwt_token');
    if (token == null) return;

    final lastSyncedAt = await _storage.read(key: 'last_synced_at') ?? '1970-01-01T00:00:00.000Z';

    bool hasMore = true;
    String? cursor;

    while (hasMore) {
      final uri = Uri.parse('$baseUrl/sync').replace(queryParameters: {
        'since': lastSyncedAt,
        'limit': '50',
        if (cursor != null) 'cursor': cursor,
      });

      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final List birthdays = body['data']['birthdays'] ?? [];
        final pagination = body['pagination'] ?? {};

        // Guardar o actualizar en SQLite local con Drift
        for (var b in birthdays) {
          // Inserción o soft-delete en Drift según deleted_at
        }

        hasMore = pagination['hasMore'] ?? false;
        cursor = pagination['nextCursor'];

        if (!hasMore) {
          await _storage.write(key: 'last_synced_at', value: body['syncTimestamp']);
        }
      } else {
        hasMore = false;
      }
    }
  }
}
