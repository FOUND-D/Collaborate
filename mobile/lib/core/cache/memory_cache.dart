class _Entry {
  _Entry(this.value, this.expiresAt, this.staleAt);

  final dynamic value;
  final DateTime expiresAt;
  final DateTime staleAt;

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isStale => DateTime.now().isAfter(staleAt);
}

/// O(1) in-memory cache with TTL and stale-while-revalidate support.
class MemoryCache {
  final Map<String, _Entry> _store = {};

  T? get<T>(String key) {
    final entry = _store[key];
    if (entry == null || entry.isExpired) {
      _store.remove(key);
      return null;
    }
    return entry.value as T;
  }

  bool isStale(String key) {
    final entry = _store[key];
    if (entry == null || entry.isExpired) return true;
    return entry.isStale;
  }

  void set(String key, dynamic value, Duration ttl, {Duration? staleAfter}) {
    final now = DateTime.now();
    final stale = staleAfter ?? Duration(milliseconds: (ttl.inMilliseconds * 0.6).round());
    _store[key] = _Entry(
      value,
      now.add(ttl),
      now.add(stale),
    );
  }

  void remove(String key) => _store.remove(key);

  void invalidatePrefix(String prefix) {
    if (prefix.isEmpty) {
      _store.clear();
      return;
    }
    _store.removeWhere((key, _) => key.startsWith(prefix));
  }

  void clear() => _store.clear();
}
