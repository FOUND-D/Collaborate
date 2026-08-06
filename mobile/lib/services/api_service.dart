import '../core/network/api_client.dart';
import '../core/utils/json_helpers.dart';

/// Typed wrappers around all server routes under `/api/*`.
class ApiService {
  ApiService(this._client);

  final ApiClient _client;

  // ─── Auth & Users ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> login(String email, String password) async {
    return asMap(await _client.post('/api/users/login', data: {
      'email': email,
      'password': password,
    }));
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> payload) async {
    return asMap(await _client.post('/api/users/register', data: payload));
  }

  Future<void> forgotPassword(String email) async {
    await _client.post('/api/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword(String token, String newPassword) async {
    await _client.post('/api/auth/reset-password', data: {
      'token': token,
      'newPassword': newPassword,
    });
  }

  Future<List<Map<String, dynamic>>> getUsers() async {
    return asMapList(await _client.get('/api/users'));
  }

  Future<List<Map<String, dynamic>>> searchUsers(String query) async {
    return asMapList(await _client.get('/api/users/search', query: {'q': query}));
  }

  Future<Map<String, dynamic>> getUserProfile({bool forceRefresh = false}) async {
    return asMap(await _client.get('/api/users/profile', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> getUserById(String id) async {
    return asMap(await _client.get('/api/users/$id'));
  }

  Future<Map<String, dynamic>> getUserStats({bool forceRefresh = false}) async {
    return asMap(await _client.get('/api/users/me/stats', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    return asMap(await _client.patch('/api/users/profile', data: data));
  }

  Future<Map<String, dynamic>> updateProfileImage(String image) async {
    return asMap(await _client.patch('/api/users/profile/image', data: {'image': image}));
  }

  Future<Map<String, dynamic>> refreshDevScore() async {
    return asMap(await _client.post('/api/users/dev-score/refresh'));
  }

  Future<Map<String, dynamic>> getGithubStats(String username, {bool showPrivate = false}) async {
    return asMap(await _client.get(
      '/api/users/github/$username',
      query: {'showPrivate': showPrivate},
    ));
  }

  // ─── Teams ────────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getTeams({bool forceRefresh = false}) async {
    return asMapList(await _client.get('/api/teams', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> getTeam(String id, {bool forceRefresh = false}) async {
    return asMap(await _client.get('/api/teams/$id', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> createTeam(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/teams', data: data));
  }

  Future<void> deleteTeam(String id) async {
    await _client.delete('/api/teams/$id');
  }

  Future<Map<String, dynamic>> joinTeam(String teamId) async {
    return asMap(await _client.post('/api/teams/$teamId/join'));
  }

  Future<Map<String, dynamic>> updateTeamJoinRequest(
    String teamId, {
    required String userId,
    required String action,
  }) async {
    return asMap(await _client.put('/api/teams/$teamId/join', data: {
      'userId': userId,
      'action': action,
    }));
  }

  Future<Map<String, dynamic>> addTeamMember(String teamId, String userId) async {
    return asMap(await _client.put('/api/teams/$teamId/members', data: {'userId': userId}));
  }

  Future<Map<String, dynamic>> linkGithubRepo(String teamId, String repoUrl) async {
    return asMap(await _client.put('/api/teams/$teamId/github', data: {'repoUrl': repoUrl}));
  }

  Future<List<Map<String, dynamic>>> getTeamCommits(String teamId) async {
    return asMapList(await _client.get('/api/teams/$teamId/commits'));
  }

  Future<List<Map<String, dynamic>>> getTeamSessions(String teamId) async {
    return asMapList(await _client.get('/api/teams/$teamId/sessions'));
  }

  Future<Map<String, dynamic>> startTeamSession(String teamId) async {
    return asMap(await _client.post('/api/teams/$teamId/sessions'));
  }

  Future<void> endTeamSession(String teamId, String sessionId) async {
    await _client.put('/api/teams/$teamId/sessions/$sessionId');
  }

  // ─── Projects ─────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getProjects({bool forceRefresh = false}) async {
    return asMapList(await _client.get('/api/projects', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> getProject(String id, {bool forceRefresh = false}) async {
    return asMap(await _client.get('/api/projects/$id', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> createProject(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/projects', data: data));
  }

  Future<Map<String, dynamic>> createProjectWithAi(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/projects/ai', data: data));
  }

  Future<Map<String, dynamic>> updateProject(String id, Map<String, dynamic> data) async {
    return asMap(await _client.put('/api/projects/$id', data: data));
  }

  Future<void> deleteProject(String id) async {
    await _client.delete('/api/projects/$id');
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getTasks({bool forceRefresh = false}) async {
    return asMapList(await _client.get('/api/tasks', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> getTask(String id, {bool forceRefresh = false}) async {
    return asMap(await _client.get('/api/tasks/$id', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> createTask(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/tasks', data: data));
  }

  Future<Map<String, dynamic>> updateTask(String id, Map<String, dynamic> data) async {
    return asMap(await _client.put('/api/tasks/$id', data: data));
  }

  Future<void> deleteTask(String id) async {
    await _client.delete('/api/tasks/$id');
  }

  Future<Map<String, dynamic>> assignTaskToTeam(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/tasks/assign-to-team', data: data));
  }

  // ─── Listings / Exchange ────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getListings({String? type, String? skill}) async {
    final query = <String, dynamic>{};
    if (type != null) query['type'] = type;
    if (skill != null) query['skill'] = skill;
    return asMapList(await _client.get('/api/listings', query: query.isEmpty ? null : query));
  }

  Future<Map<String, dynamic>> getListing(String id) async {
    return asMap(await _client.get('/api/listings/$id'));
  }

  Future<Map<String, dynamic>> createListing(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/listings', data: data));
  }

  Future<Map<String, dynamic>> updateListing(String id, Map<String, dynamic> data) async {
    return asMap(await _client.put('/api/listings/$id', data: data));
  }

  Future<void> deleteListing(String id) async {
    await _client.delete('/api/listings/$id');
  }

  // ─── Booking Sessions ─────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getBookingSessions({String? teamId}) async {
    return asMapList(await _client.get(
      '/api/booking-sessions',
      query: teamId != null ? {'team_id': teamId} : null,
    ));
  }

  Future<Map<String, dynamic>> createBookingSession(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/sessions', data: data));
  }

  Future<Map<String, dynamic>> confirmSession(String id) async {
    return asMap(await _client.put('/api/sessions/$id/confirm'));
  }

  Future<Map<String, dynamic>> cancelSession(String id) async {
    return asMap(await _client.patch('/api/booking-sessions/$id/cancel'));
  }

  Future<Map<String, dynamic>> completeSession(String id) async {
    return asMap(await _client.put('/api/sessions/$id/complete'));
  }

  // ─── Meetings ─────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getMeeting(String teamId) async {
    return asMap(await _client.get('/api/meetings', query: {'teamId': teamId}));
  }

  Future<Map<String, dynamic>> startMeeting(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/meetings', data: data));
  }

  Future<Map<String, dynamic>> endMeeting(String meetingId) async {
    return asMap(await _client.put('/api/meetings/$meetingId'));
  }

  Future<Map<String, dynamic>> updateMeetingAgenda(String meetingId, String agenda) async {
    return asMap(await _client.patch('/api/meetings/$meetingId/agenda', data: {'agenda': agenda}));
  }

  Future<Map<String, dynamic>> summariseMeeting(String meetingId) async {
    return asMap(await _client.post('/api/meetings/$meetingId/summarise'));
  }

  // ─── Skills ───────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getSkills() async {
    return asMapList(await _client.get('/api/skills'));
  }

  Future<List<Map<String, dynamic>>> getSkillsForUser(String userId) async {
    return asMapList(await _client.get('/api/skills/user/$userId'));
  }

  Future<Map<String, dynamic>> createUserSkill(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/skills/user', data: data));
  }

  Future<void> deleteUserSkill(String skillId, {String? type}) async {
    final suffix = type != null ? '?type=${Uri.encodeComponent(type)}' : '';
    await _client.delete('/api/skills/user/$skillId$suffix');
  }

  Future<List<Map<String, dynamic>>> getSkillMatches({bool forceRefresh = false}) async {
    return asMapList(await _client.get('/api/skills/matches', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> getSkillVenn() async {
    return asMap(await _client.get('/api/skills/venn'));
  }

  Future<List<Map<String, dynamic>>> getSkillMatchmaking({String? userId}) async {
    final path = userId != null ? '/api/skills/match/$userId' : '/api/skills/match';
    return asMapList(await _client.get(path));
  }

  // ─── Messages & Chat ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>> sendMessage(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/messages', data: data));
  }

  Future<List<Map<String, dynamic>>> getConversations() async {
    return asMapList(await _client.get('/api/messages/conversations'));
  }

  Future<List<Map<String, dynamic>>> getTeamMessages(String teamId) async {
    return asMapList(await _client.get('/api/messages/team/$teamId'));
  }

  Future<List<Map<String, dynamic>>> getConversationMessages(String conversationId) async {
    return asMapList(await _client.get('/api/messages/conversation/$conversationId'));
  }

  Future<void> markMessagesRead(List<String> messageIds) async {
    await _client.put('/api/messages/read', data: {'messageIds': messageIds});
  }

  // ─── Resources ────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getResources({String? teamId, String? orgId}) async {
    final query = <String, dynamic>{};
    if (teamId != null) query['teamId'] = teamId;
    if (orgId != null) query['orgId'] = orgId;
    return asMapList(await _client.get('/api/resources', query: query.isEmpty ? null : query));
  }

  Future<Map<String, dynamic>> createResource(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/resources', data: data));
  }

  Future<void> deleteResource(String id) async {
    await _client.delete('/api/resources/$id');
  }

  Future<Map<String, dynamic>> summariseResource(String id) async {
    return asMap(await _client.post('/api/resources/$id/summarise'));
  }

  Future<Map<String, dynamic>> togglePinResource(String id) async {
    return asMap(await _client.patch('/api/resources/$id/pin'));
  }

  // ─── Announcements ────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getAnnouncements({String? orgId}) async {
    return asMapList(await _client.get(
      '/api/announcements',
      query: orgId != null ? {'orgId': orgId} : null,
    ));
  }

  Future<Map<String, dynamic>> createAnnouncement(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/announcements', data: data));
  }

  Future<void> deleteAnnouncement(String id) async {
    await _client.delete('/api/announcements/$id');
  }

  Future<Map<String, dynamic>> toggleAnnouncementRsvp(String id) async {
    return asMap(await _client.post('/api/announcements/$id/rsvp'));
  }

  // ─── Ratings ──────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> createRating(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/ratings', data: data));
  }

  Future<List<Map<String, dynamic>>> getRatings(String userId) async {
    return asMapList(await _client.get('/api/ratings/$userId'));
  }

  // ─── Leaderboard ──────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getLeaderboard({bool nearbyOnly = false}) async {
    return asMapList(await _client.get(
      '/api/leaderboard',
      query: nearbyOnly ? {'nearby': 'true'} : null,
    ));
  }

  // ─── Badges ───────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getUserBadges(String userId) async {
    return asMapList(await _client.get('/api/badges/user/$userId'));
  }

  Future<Map<String, dynamic>> toggleBadgeVisibility(String badgeId) async {
    return asMap(await _client.put('/api/badges/$badgeId/visibility'));
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getNotifications() async {
    return asMapList(await _client.get('/api/notifications'));
  }

  Future<void> markNotificationRead(String id) async {
    await _client.put('/api/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _client.put('/api/notifications/read-all');
  }

  // ─── Complaints ───────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getComplaints() async {
    return asMapList(await _client.get('/api/complaints'));
  }

  Future<void> createComplaint(Map<String, dynamic> data) async {
    await _client.post('/api/complaints', data: data);
  }

  Future<void> resolveComplaint(String id) async {
    await _client.delete('/api/complaints/$id/resolve');
  }

  Future<void> deleteComplaint(String id) async {
    await _client.delete('/api/complaints/$id');
  }

  // ─── Search ───────────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> globalSearch(String query) async {
    return asMapList(await _client.get('/api/search', query: {'q': query}));
  }

  // ─── Organisations ────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getOrganisations({bool forceRefresh = false}) async {
    return asMapList(await _client.get('/api/organisations', forceRefresh: forceRefresh));
  }

  Future<Map<String, dynamic>> getOrganisation(String id) async {
    return asMap(await _client.get('/api/organisations/$id'));
  }

  Future<Map<String, dynamic>> createOrganisation(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/organisations', data: data));
  }

  Future<Map<String, dynamic>> updateOrganisation(String id, Map<String, dynamic> data) async {
    return asMap(await _client.put('/api/organisations/$id', data: data));
  }

  Future<void> deleteOrganisation(String id) async {
    await _client.delete('/api/organisations/$id');
  }

  Future<List<Map<String, dynamic>>> getOrgMembers(String orgId) async {
    return asMapList(await _client.get('/api/organisations/$orgId/members'));
  }

  Future<void> inviteOrgMember(String orgId, String email, String role) async {
    await _client.post('/api/organisations/$orgId/members/invite', data: {
      'email': email,
      'role': role,
    });
  }

  Future<void> updateOrgMemberRole(String orgId, String userId, String role) async {
    await _client.put('/api/organisations/$orgId/members/$userId/role', data: {'role': role});
  }

  Future<void> removeOrgMember(String orgId, String memberId) async {
    await _client.delete('/api/organisations/$orgId/members/$memberId');
  }

  Future<List<Map<String, dynamic>>> getOrgTeams(String orgId) async {
    return asMapList(await _client.get('/api/organisations/$orgId/teams'));
  }

  Future<Map<String, dynamic>> acceptOrgInvite(String token, {String? org}) async {
    return asMap(await _client.get('/api/organisations/invite/accept', query: {
      'token': token,
      if (org != null) 'org': org,
    }));
  }

  // Org management (/api/orgs)
  Future<List<Map<String, dynamic>>> listOrgMembersManaged(String orgId, {int limit = 20}) async {
    return asMapList(await _client.get('/api/orgs/$orgId/members', query: {'limit': limit}));
  }

  Future<List<Map<String, dynamic>>> listOrgRoles(String orgId) async {
    return asMapList(await _client.get('/api/orgs/$orgId/roles'));
  }

  Future<Map<String, dynamic>> createOrgRole(String orgId, Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/orgs/$orgId/roles', data: data));
  }

  Future<Map<String, dynamic>> getOrgCompliance(String orgId) async {
    return asMap(await _client.get('/api/orgs/$orgId/compliance'));
  }

  Future<Map<String, dynamic>> getOrgComplianceMe(String orgId) async {
    return asMap(await _client.get('/api/orgs/$orgId/compliance/me'));
  }

  Future<List<Map<String, dynamic>>> listOrgCustomFields(String orgId) async {
    return asMapList(await _client.get('/api/orgs/$orgId/custom-fields'));
  }

  Future<List<Map<String, dynamic>>> getOrgAuditLog(String orgId, {int limit = 20}) async {
    return asMapList(await _client.get('/api/orgs/$orgId/audit-log', query: {'limit': limit}));
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAdminStats() async {
    return asMap(await _client.get('/api/admin/stats'));
  }

  Future<List<Map<String, dynamic>>> getAdminTopSkills() async {
    return asMapList(await _client.get('/api/admin/top-skills'));
  }

  Future<List<Map<String, dynamic>>> getAdminUsers({Map<String, dynamic>? params}) async {
    return asMapList(await _client.get('/api/admin/users', query: params));
  }

  Future<void> updateAdminUserRole(String userId, String role) async {
    await _client.patch('/api/admin/users/$userId/role', data: {'role': role});
  }

  Future<void> toggleAdminUserSuspension(String userId, {bool? suspended}) async {
    await _client.patch('/api/admin/users/$userId/suspend', data: {
      if (suspended != null) 'suspended': suspended,
    });
  }

  Future<void> deleteAdminUser(String userId) async {
    await _client.delete('/api/admin/users/$userId');
  }

  Future<List<Map<String, dynamic>>> getFacultyWhitelist() async {
    return asMapList(await _client.get('/api/admin/faculty-whitelist'));
  }

  Future<Map<String, dynamic>> addFacultyWhitelist(Map<String, dynamic> data) async {
    return asMap(await _client.post('/api/admin/faculty-whitelist', data: data));
  }

  Future<void> deleteFacultyWhitelist(String id) async {
    await _client.delete('/api/admin/faculty-whitelist/$id');
  }

  Future<List<Map<String, dynamic>>> getAdminSkills() async {
    return asMapList(await _client.get('/api/admin/skills'));
  }

  Future<void> deleteAdminSkill(String id) async {
    await _client.delete('/api/admin/skills/$id');
  }

  Future<Map<String, dynamic>> patchAdminSkill(String id, Map<String, dynamic> data) async {
    return asMap(await _client.patch('/api/admin/skills/$id', data: data));
  }

  Future<List<Map<String, dynamic>>> getAdminListings({String? status}) async {
    return asMapList(await _client.get(
      '/api/admin/listings',
      query: status != null ? {'status': status} : null,
    ));
  }

  Future<void> updateAdminListingStatus(String id, String status) async {
    await _client.patch('/api/admin/listings/$id/status', data: {'status': status});
  }

  Future<void> deleteAdminListing(String id) async {
    await _client.delete('/api/admin/listings/$id');
  }

  Future<List<Map<String, dynamic>>> getAdminSessions({String? status}) async {
    return asMapList(await _client.get(
      '/api/admin/sessions',
      query: status != null ? {'status': status} : null,
    ));
  }

  Future<List<Map<String, dynamic>>> getAdminAnnouncements() async {
    return asMapList(await _client.get('/api/admin/announcements'));
  }

  Future<void> deleteAdminAnnouncement(String id) async {
    await _client.delete('/api/admin/announcements/$id');
  }
}
