import 'dart:async';

import 'package:dio/dio.dart';
import '../../config/app_config.dart';
import '../cache/api_cache_manager.dart';
import 'concurrency_limiter.dart';
import 'retry_interceptor.dart';

typedef TokenProvider = String? Function();
typedef OnUnauthorized = void Function();

class ApiClient {
  ApiClient({
    required TokenProvider tokenProvider,
    OnUnauthorized? onUnauthorized,
    ApiCacheManager? cache,
  })  : _tokenProvider = tokenProvider,
        _onUnauthorized = onUnauthorized,
        _cache = cache ?? ApiCacheManager.shared {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.requestTimeout,
        receiveTimeout: AppConfig.requestTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
        },
      ),
    );

    _dio.interceptors.add(RetryInterceptor(_dio));
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
  final ApiCacheManager _cache;
  final ConcurrencyLimiter _limiter = ConcurrencyLimiter(
    maxConcurrent: AppConfig.maxConcurrentRequests,
  );

  Dio get dio => _dio;
  ApiCacheManager get cache => _cache;

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

  Future<T> _request<T>(Future<T> Function() action) => _limiter.run(action);

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? query,
    bool forceRefresh = false,
  }) async {
    if (!ApiCacheManager.shouldCache('GET', path)) {
      return _request(() async {
        final res = await _dio.get<T>(path, queryParameters: query);
        return res.data as T;
      });
    }

    final key = ApiCacheManager.cacheKey('GET', path, query);
    final ttl = ApiCacheManager.ttlForPath(path);
    return _cache.fetch<T>(
      key: key,
      ttl: ttl,
      forceRefresh: forceRefresh,
      network: () => _request(() async {
        final res = await _dio.get<T>(path, queryParameters: query);
        return res.data as T;
      }),
    );
  }

  Future<T> post<T>(String path, {dynamic data, Map<String, dynamic>? query}) async {
    return _request(() async {
      final res = await _dio.post<T>(path, data: data, queryParameters: query);
      _invalidateForMutation(path);
      return res.data as T;
    });
  }

  Future<T> put<T>(String path, {dynamic data, Map<String, dynamic>? query}) async {
    return _request(() async {
      final res = await _dio.put<T>(path, data: data, queryParameters: query);
      _invalidateForMutation(path);
      return res.data as T;
    });
  }

  Future<T> patch<T>(String path, {dynamic data, Map<String, dynamic>? query}) async {
    return _request(() async {
      final res = await _dio.patch<T>(path, data: data, queryParameters: query);
      _invalidateForMutation(path);
      return res.data as T;
    });
  }

  Future<T> delete<T>(String path, {dynamic data, Map<String, dynamic>? query}) async {
    return _request(() async {
      final res = await _dio.delete<T>(path, data: data, queryParameters: query);
      _invalidateForMutation(path);
      return res.data as T;
    });
  }

  void invalidateCache([String? prefix]) {
    if (prefix == null || prefix.isEmpty) {
      _cache.clear();
      return;
    }
    _cache.invalidatePrefix(prefix);
  }

  void _invalidateForMutation(String path) {
    final segments = path.split('/').where((s) => s.isNotEmpty).toList();
    if (segments.length < 2) return;
    final collection = '/${segments.take(3).join('/')}';
    _cache.invalidatePrefix('GET:$collection');
    if (segments.length >= 3) {
      _cache.invalidatePrefix('GET:$path');
    }
    if (path.contains('/users/profile')) {
      _cache.invalidatePrefix('GET:/api/users/profile');
      _cache.invalidatePrefix('GET:/api/users/me/stats');
    }
    if (path.contains('/messages')) {
      _cache.invalidatePrefix('GET:/api/messages');
    }
    if (path.contains('/organisations')) {
      _cache.invalidatePrefix('GET:/api/organisations');
      _cache.invalidatePrefix('GET:/api/orgs');
    }
  }
}
