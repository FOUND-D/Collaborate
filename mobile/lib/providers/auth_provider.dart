import 'dart:async';

import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../core/network/socket_service.dart';
import '../core/storage/auth_storage.dart';
import '../core/utils/json_helpers.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    _bootstrap();
  }

  final AuthStorage _storage = AuthStorage();
  late final ApiClient _apiClient = ApiClient(
    tokenProvider: () => _user?['token'] as String?,
    onUnauthorized: logout,
  );
  late final ApiService api = ApiService(_apiClient);
  final SocketService socketService = SocketService();

  Map<String, dynamic>? _user;
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _currentOrg;
  bool _hasTeam = false;

  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _loading;
  String? get error => _error;
  Map<String, dynamic>? get currentOrg => _currentOrg;
  bool get hasTeam => _hasTeam;
  bool get isAdmin => str(_user?['role']) == 'admin';
  String? get userId => pickId(_user) ?? str(_user?['_id']);

  Future<void> _bootstrap() async {
    _user = await _storage.getUser();
    _loading = false;
    notifyListeners();
    if (_user != null) {
      unawaited(_warmSession());
    }
  }

  Future<void> _warmSession() async {
    await _connectSocket();
    await refreshMembership();
  }

  Future<void> _connectSocket() async {
    final token = _user?['token'] as String?;
    socketService.connect(token: token);
    final uid = userId;
    if (uid != null) {
      socketService.joinNotificationRoom(uid);
    }
  }

  Future<void> login(String email, String password) async {
    _error = null;
    _loading = true;
    notifyListeners();
    try {
      _user = await api.login(email, password);
      await _storage.saveUser(_user!);
      unawaited(_warmSession());
    } catch (e) {
      _error = _apiClient.messageFromError(e);
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> register(Map<String, dynamic> payload) async {
    _error = null;
    _loading = true;
    notifyListeners();
    try {
      _user = await api.register(payload);
      await _storage.saveUser(_user!);
      unawaited(_warmSession());
    } catch (e) {
      _error = _apiClient.messageFromError(e);
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    socketService.disconnect();
    _apiClient.invalidateCache();
    _user = null;
    _currentOrg = null;
    _hasTeam = false;
    await _storage.clearUser();
    notifyListeners();
  }

  Future<void> refreshUser() async {
    if (_user == null) return;
    try {
      final profile = await api.getUserProfile();
      _user = {..._user!, ...profile};
      await _storage.saveUser(_user!);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> updateUserLocal(Map<String, dynamic> patch) async {
    if (_user == null) return;
    _user = {..._user!, ...patch};
    await _storage.saveUser(_user!);
    notifyListeners();
  }

  Future<void> refreshMembership() async {
    if (_user == null) return;
    try {
      final results = await Future.wait([
        api.getOrganisations(),
        api.getTeams(),
      ]);
      final orgs = results[0] as List<Map<String, dynamic>>;
      final teams = results[1] as List<Map<String, dynamic>>;
      _hasTeam = teams.isNotEmpty;
      if (orgs.isNotEmpty) {
        final savedOrgId = await _storage.getCurrentOrgId();
        _currentOrg = orgs.firstWhere(
          (o) => pickId(o) == savedOrgId,
          orElse: () => orgs.first,
        );
      } else {
        _currentOrg = null;
      }
      notifyListeners();
    } catch (_) {}
  }

  void setCurrentOrg(Map<String, dynamic>? org) {
    _currentOrg = org;
    _storage.saveCurrentOrgId(org != null ? pickId(org)?.toString() : null);
    notifyListeners();
  }
}
