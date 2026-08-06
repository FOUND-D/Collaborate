import 'dart:async';

import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

/// In-memory workspace store with stale-while-revalidate loading.
class WorkspaceProvider extends ChangeNotifier {
  WorkspaceProvider(this._api);

  final ApiService _api;

  List<Map<String, dynamic>> teams = [];
  List<Map<String, dynamic>> projects = [];
  List<Map<String, dynamic>> tasks = [];
  List<Map<String, dynamic>> organisations = [];
  List<Map<String, dynamic>> skillMatches = [];
  Map<String, dynamic>? userStats;

  bool teamsLoading = false;
  bool projectsLoading = false;
  bool tasksLoading = false;
  bool organisationsLoading = false;
  bool dashboardLoading = false;
  String? dashboardError;

  Future<void>? _dashboardFuture;

  Future<void> prefetchEssentials() => loadDashboard();

  Future<void> loadTeams({bool forceRefresh = false}) async {
    if (teams.isEmpty) teamsLoading = true;
    notifyListeners();
    try {
      teams = await _api.getTeams(forceRefresh: forceRefresh);
    } catch (_) {}
    finally {
      teamsLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadProjects({bool forceRefresh = false}) async {
    if (projects.isEmpty) projectsLoading = true;
    notifyListeners();
    try {
      projects = await _api.getProjects(forceRefresh: forceRefresh);
    } catch (_) {}
    finally {
      projectsLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadTasks({bool forceRefresh = false}) async {
    if (tasks.isEmpty) tasksLoading = true;
    notifyListeners();
    try {
      tasks = await _api.getTasks(forceRefresh: forceRefresh);
    } catch (_) {}
    finally {
      tasksLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadOrganisations({bool forceRefresh = false}) async {
    if (organisations.isEmpty) organisationsLoading = true;
    notifyListeners();
    try {
      organisations = await _api.getOrganisations(forceRefresh: forceRefresh);
    } catch (_) {}
    finally {
      organisationsLoading = false;
      notifyListeners();
    }
  }

  /// Loads dashboard stats in the background. Safe to call multiple times — deduped.
  Future<void> loadDashboard({bool forceRefresh = false}) {
    if (!forceRefresh && _dashboardFuture != null) {
      return _dashboardFuture!;
    }
    _dashboardFuture = _loadDashboard(forceRefresh).whenComplete(() {
      _dashboardFuture = null;
    });
    return _dashboardFuture!;
  }

  Future<void> _loadDashboard(bool forceRefresh) async {
    final showSpinner = userStats == null && skillMatches.isEmpty;
    if (showSpinner) {
      dashboardLoading = true;
      dashboardError = null;
      notifyListeners();
    }

    try {
      userStats = await _api.getUserStats(forceRefresh: forceRefresh);
      notifyListeners();
      skillMatches = await _api.getSkillMatches(forceRefresh: forceRefresh);
      dashboardError = null;
    } catch (e) {
      dashboardError = _friendlyError(e);
    } finally {
      dashboardLoading = false;
      notifyListeners();
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

  void clear() {
    teams = [];
    projects = [];
    tasks = [];
    organisations = [];
    skillMatches = [];
    userStats = null;
    dashboardLoading = false;
    dashboardError = null;
    _dashboardFuture = null;
    notifyListeners();
  }
}
