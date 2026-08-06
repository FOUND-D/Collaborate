import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class DiskCacheEntry {
  DiskCacheEntry(this.value, this.expiresAtMs);

  final dynamic value;
  final int expiresAtMs;

  bool get isExpired => DateTime.now().millisecondsSinceEpoch > expiresAtMs;
}

/// Persists hot cache entries across app restarts.
class DiskCache {
  static const _prefix = 'api_cache:';

  Future<DiskCacheEntry?> get(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_prefix$key');
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      final entry = DiskCacheEntry(decoded['v'], decoded['e'] as int);
      if (entry.isExpired) {
        await prefs.remove('$_prefix$key');
        return null;
      }
      return entry;
    } catch (_) {
      await prefs.remove('$_prefix$key');
      return null;
    }
  }

  Future<void> set(String key, dynamic value, Duration ttl) async {
    final prefs = await SharedPreferences.getInstance();
    final payload = jsonEncode({
      'v': value,
      'e': DateTime.now().add(ttl).millisecondsSinceEpoch,
    });
    await prefs.setString('$_prefix$key', payload);
  }

  Future<void> remove(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_prefix$key');
  }

  Future<void> invalidatePrefix(String prefix) async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith('$_prefix$prefix'));
    for (final k in keys) {
      await prefs.remove(k);
    }
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith(_prefix)).toList();
    for (final k in keys) {
      await prefs.remove(k);
    }
  }
}
