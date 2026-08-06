import 'package:dio/dio.dart';
import '../../config/app_config.dart';

typedef TokenProvider = String? Function();
typedef OnUnauthorized = void Function();

class ApiClient {
  ApiClient({
    required TokenProvider tokenProvider,
    OnUnauthorized? onUnauthorized,
  })  : _tokenProvider = tokenProvider,
        _onUnauthorized = onUnauthorized {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.requestTimeout,
        receiveTimeout: AppConfig.requestTimeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _tokenProvider();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          final message = _extractMessage(error);
          if (message == 'Not authorized, token failed' ||
              message == 'No authorization token found') {
            _onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  late final Dio _dio;
  final TokenProvider _tokenProvider;
  final OnUnauthorized? _onUnauthorized;

  Dio get dio => _dio;

  String _extractMessage(DioException error) {
    final data = error.response?.data;
    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }
    return error.message ?? 'Request failed';
  }

  String messageFromError(Object error) {
    if (error is DioException) return _extractMessage(error);
    return error.toString();
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) async {
    final res = await _dio.get<T>(path, queryParameters: query);
    return res.data as T;
  }

  Future<T> post<T>(String path, {dynamic data, Map<String, dynamic>? query}) async {
    final res = await _dio.post<T>(path, data: data, queryParameters: query);
    return res.data as T;
  }

  Future<T> put<T>(String path, {dynamic data, Map<String, dynamic>? query}) async {
    final res = await _dio.put<T>(path, data: data, queryParameters: query);
    return res.data as T;
  }

  Future<T> patch<T>(String path, {dynamic data, Map<String, dynamic>? query}) async {
    final res = await _dio.patch<T>(path, data: data, queryParameters: query);
    return res.data as T;
  }

  Future<T> delete<T>(String path, {dynamic data, Map<String, dynamic>? query}) async {
    final res = await _dio.delete<T>(path, data: data, queryParameters: query);
    return res.data as T;
  }
}
