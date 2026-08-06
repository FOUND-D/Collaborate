import 'dart:async';
import 'dart:collection';

/// Limits parallel HTTP calls so a cold Render instance isn't overwhelmed.
class ConcurrencyLimiter {
  ConcurrencyLimiter({this.maxConcurrent = 3});

  final int maxConcurrent;
  int _active = 0;
  final Queue<Completer<void>> _queue = Queue();

  Future<T> run<T>(Future<T> Function() action) async {
    await _acquire();
    try {
      return await action();
    } finally {
      _release();
    }
  }

  Future<void> _acquire() {
    if (_active < maxConcurrent) {
      _active++;
      return Future.value();
    }
    final completer = Completer<void>();
    _queue.add(completer);
    return completer.future;
  }

  void _release() {
    if (_queue.isNotEmpty) {
      _queue.removeFirst().complete();
      return;
    }
    _active--;
  }
}
