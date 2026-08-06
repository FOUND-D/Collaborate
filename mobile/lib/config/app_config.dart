/// Production API configuration — matches web client [productionUrls.js].
class AppConfig {
  static const String apiBaseUrl = 'https://collaborate-1.onrender.com';
  static const String socketUrl = 'https://collaborate-1.onrender.com';
  static const Duration requestTimeout = Duration(seconds: 45);
  static const Duration coldStartTimeout = Duration(seconds: 60);
  static const int maxConcurrentRequests = 3;
  static const String appName = 'Collaborate';

  // Cache TTLs
  static const Duration cacheListTtl = Duration(minutes: 3);
  static const Duration cacheDetailTtl = Duration(minutes: 5);
  static const Duration cacheStatsTtl = Duration(minutes: 1);
}
