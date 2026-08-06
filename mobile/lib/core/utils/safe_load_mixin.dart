import 'package:flutter/material.dart';

/// Ensures loading spinners always stop and surfaces API errors.
mixin SafeLoadMixin<T extends StatefulWidget> on State<T> {
  String? loadError;

  Future<void> safeLoad(Future<void> Function() action) async {
    if (!mounted) return;
    setState(() => loadError = null);
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => loadError = _friendlyError(e));
    }
  }

  String _friendlyError(Object e) {
    final msg = e.toString();
    if (msg.contains('timeout') || msg.contains('Timeout')) {
      return 'Server is waking up — pull to refresh or try again in a moment.';
    }
    if (msg.contains('connection error') || msg.contains('SocketException')) {
      return 'Network error — check your connection and try again.';
    }
    return msg.replaceFirst('Exception: ', '');
  }

  Widget? loadErrorBanner({VoidCallback? onRetry}) {
    if (loadError == null) return null;
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Material(
        color: Colors.red.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        child: ListTile(
          title: Text(loadError!, style: const TextStyle(color: Colors.red)),
          trailing: onRetry != null
              ? TextButton(onPressed: onRetry, child: const Text('Retry'))
              : null,
        ),
      ),
    );
  }
}
