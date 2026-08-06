import 'package:dio/dio.dart';

/// Retries timeouts and connection failures (typical on Render cold start).
class RetryInterceptor extends Interceptor {
  RetryInterceptor(this._dio, {this.maxRetries = 2});

  final Dio _dio;
  final int maxRetries;

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final retryCount = (err.requestOptions.extra['retryCount'] as int?) ?? 0;
    if (!_shouldRetry(err) || retryCount >= maxRetries) {
      handler.next(err);
      return;
    }

    err.requestOptions.extra['retryCount'] = retryCount + 1;
    await Future<void>.delayed(Duration(milliseconds: 800 * (retryCount + 1)));

    try {
      final response = await _dio.fetch(err.requestOptions);
      handler.resolve(response);
    } catch (e) {
      if (e is DioException) {
        handler.next(e);
      } else {
        handler.next(err);
      }
    }
  }

  bool _shouldRetry(DioException err) {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.connectionError) {
      return true;
    }
    final status = err.response?.statusCode;
    return status == 502 || status == 503 || status == 504;
  }
}
