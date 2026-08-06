import 'package:dio/dio.dart';
import '../../config/app_config.dart';

/// Wakes the Render backend once before authenticated API traffic.
class ConnectionPrewarmer {
  static Future<void>? _future;
  static bool isWarm = false;

  static Future<void> prewarm() {
    _future ??= _run();
    return _future!;
  }

  static Future<void> _run() async {
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.coldStartTimeout,
        receiveTimeout: AppConfig.coldStartTimeout,
        headers: {'Accept': 'text/plain'},
      ),
    );
    try {
      await dio.get('/');
      isWarm = true;
    } catch (_) {
      // Server may still be waking; retries on real requests will handle it.
    }
  }
}
