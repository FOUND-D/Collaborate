import 'dart:async';
import 'dart:convert';

import '../../config/app_config.dart';
import 'disk_cache.dart';
import 'memory_cache.dart';
import 'request_coalescer.dart';

class ApiCacheManager {
  ApiCacheManager({DiskCache? disk})
      : _disk = disk ?? DiskCache();

  final MemoryCache _memory = MemoryCache();
  final RequestCoalescer _coalescer = RequestCoalescer();
  final DiskCache _disk;
  bool _hydrated = false;

  static const _persistedKeys = {
    'GET:/api/teams',
    'GET:/api/projects',
    'GET:/api/tasks',
    'GET:/api/organisations',
    'GET:/api/users/profile',
  };

  Future<void> hydrate() async {
    if (_hydrated) return;
    _hydrated = true;
    await Future.wait(_persistedKeys.map((key) async {
      final entry = await _disk.get(key);
      if (entry == null) return;
      _memory.set(
        key,
        entry.value,
        AppConfig.cacheListTtl,
        staleAfter: const Duration(seconds: 0),
      );
    }));
  }

  Future<T> fetch<T>({
    required String key,
    required Duration ttl,
    required Future<T> Function() network,
    bool forceRefresh = false,
    bool persist = false,
  }) async {
    if (!forceRefresh) {
      final cached = _memory.get<T>(key);
      if (cached != null) {
        if (_memory.isStale(key)) {
          unawaited(_refresh(key, ttl, network, persist: persist));
        }
        return cached;
      }

      if (persist || _persistedKeys.contains(key)) {
        final diskEntry = await _disk.get(key);
        if (diskEntry != null) {
          final value = diskEntry.value as T;
          _memory.set(key, value, ttl);
          unawaited(_refresh(key, ttl, network, persist: persist));
          return value;
        }
      }
    }

    return _coalescer.run(key, () => _refresh(key, ttl, network, persist: persist));
  }

  Future<T> _refresh<T>(
    String key,
    Duration ttl,
    Future<T> Function() network, {
    required bool persist,
  }) async {
    final fresh = await network();
    _memory.set(key, fresh, ttl);
    if (persist || _persistedKeys.contains(key)) {
      await _disk.set(key, fresh, ttl);
    }
    return fresh;
  }

  void invalidatePrefix(String prefix) {
    _memory.invalidatePrefix(prefix);
    unawaited(_disk.invalidatePrefix(prefix));
  }

  void clear() {
    _memory.clear();
    _coalescer.clear();
    unawaited(_disk.clearAll());
  }

  static String cacheKey(String method, String path, [Map<String, dynamic>? query]) {
    if (query == null || query.isEmpty) return '$method:$path';
    final sorted = Map.fromEntries(
      query.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
    );
    return '$method:$path?${jsonEncode(sorted)}';
  }

  static Duration ttlForPath(String path) {
    if (path.contains('/login') || path.contains('/register') || path.contains('/auth/')) {
      return Duration.zero;
    }
    if (path.contains('/stats') || path.contains('/leaderboard')) {
      return AppConfig.cacheStatsTtl;
    }
    if (path.contains('/notifications')) {
      return const Duration(seconds: 45);
    }
    if (path.contains('/messages/conversation') || path.contains('/messages/team/')) {
      return const Duration(seconds: 20);
    }
    if (path.contains('/messages/conversations')) {
      return const Duration(seconds: 45);
    }
    if (path.contains('/admin/')) {
      return const Duration(minutes: 2);
    }
    final segments = path.split('/');
    final last = segments.isNotEmpty ? segments.last : '';
    final isDetail = last.isNotEmpty && !last.endsWith('s') && !last.contains('-');
    return isDetail ? AppConfig.cacheDetailTtl : AppConfig.cacheListTtl;
  }

  static bool shouldCache(String method, String path) {
    if (method != 'GET') return false;
    if (path.contains('/login') || path.contains('/register')) return false;
    if (path.contains('/auth/forgot') || path.contains('/auth/reset')) return false;
    if (path.contains('/invite/accept')) return false;
    return true;
  }
}
