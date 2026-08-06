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

  Future<void> prefetchAll() {
    return Future.wait([
      loadTeams(),
      loadProjects(),
      loadTasks(),
      loadOrganisations(),
      loadDashboard(),
    ]);
  }

  Future<void> loadTeams({bool forceRefresh = false}) async {
    if (teams.isEmpty) teamsLoading = true;
    notifyListeners();
    try {
      teams = await _api.getTeams(forceRefresh: forceRefresh);
    } finally {
      teamsLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadProjects({bool forceRefresh = false}) async {
    if (projects.isEmpty) projectsLoading = true;
    notifyListeners();
    try {
      projects = await _api.getProjects(forceRefresh: forceRefresh);
    } finally {
      projectsLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadTasks({bool forceRefresh = false}) async {
    if (tasks.isEmpty) tasksLoading = true;
    notifyListeners();
    try {
      tasks = await _api.getTasks(forceRefresh: forceRefresh);
    } finally {
      tasksLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadOrganisations({bool forceRefresh = false}) async {
    if (organisations.isEmpty) organisationsLoading = true;
    notifyListeners();
    try {
      organisations = await _api.getOrganisations(forceRefresh: forceRefresh);
    } finally {
      organisationsLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadDashboard({bool forceRefresh = false}) async {
    if (userStats == null && skillMatches.isEmpty) dashboardLoading = true;
    notifyListeners();
    try {
      final results = await Future.wait([
        _api.getUserStats(forceRefresh: forceRefresh),
        _api.getSkillMatches(forceRefresh: forceRefresh),
      ]);
      userStats = results[0] as Map<String, dynamic>;
      skillMatches = results[1] as List<Map<String, dynamic>>;
    } finally {
      dashboardLoading = false;
      notifyListeners();
    }
  }

  void clear() {
    teams = [];
    projects = [];
    tasks = [];
    organisations = [];
    skillMatches = [];
    userStats = null;
    notifyListeners();
  }
}
