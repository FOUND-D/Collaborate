/// Deduplicates concurrent identical network requests (single-flight pattern).
class RequestCoalescer {
  final Map<String, Future<dynamic>> _inflight = {};

  Future<T> run<T>(String key, Future<T> Function() fetch) {
    final existing = _inflight[key];
    if (existing != null) return existing as Future<T>;

    final future = fetch().whenComplete(() => _inflight.remove(key));
    _inflight[key] = future;
    return future;
  }

  void clear() => _inflight.clear();
}
