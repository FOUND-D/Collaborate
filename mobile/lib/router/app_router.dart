import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_shell.dart';
import '../features/landing/landing_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/auth/forgot_password_screen.dart';
import '../features/auth/reset_password_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/projects/projects_screen.dart';
import '../features/projects/project_detail_screen.dart';
import '../features/projects/project_create_screen.dart';
import '../features/teams/teams_screen.dart';
import '../features/teams/team_detail_screen.dart';
import '../features/tasks/tasks_screen.dart';
import '../features/tasks/task_edit_screen.dart';
import '../features/exchange/exchange_screen.dart';
import '../features/exchange/listing_detail_screen.dart';
import '../features/sessions/sessions_screen.dart';
import '../features/sessions/session_detail_screen.dart';
import '../features/resources/resources_screen.dart';
import '../features/leaderboard/leaderboard_screen.dart';
import '../features/ratings/my_ratings_screen.dart';
import '../features/skills/skill_sharing_screen.dart';
import '../features/chat/chat_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/organisations/organisations_screen.dart';
import '../features/organisations/create_organisation_screen.dart';
import '../features/organisations/organisation_detail_screen.dart';
import '../features/organisations/accept_invite_screen.dart';
import '../features/admin/admin_dashboard_screen.dart';
import '../features/admin/admin_complaints_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/meetings/meeting_screen.dart';

class AppRouter {
  static GoRouter create(AuthProvider auth) {
    return GoRouter(
      initialLocation: '/',
      refreshListenable: auth,
      redirect: (context, state) {
        final loggedIn = auth.isAuthenticated;
        final loading = auth.isLoading;
        final path = state.uri.path;
        final isAuthRoute = path == '/login' ||
            path == '/register' ||
            path == '/forgot-password' ||
            path.startsWith('/reset-password') ||
            path == '/' ||
            path.startsWith('/invite/accept');

        if (loading) return null;
        if (!loggedIn && !isAuthRoute) return '/login';
        if (loggedIn && (path == '/login' || path == '/register' || path == '/')) {
          return '/dashboard';
        }
        if (loggedIn && path.startsWith('/admin') && !auth.isAdmin) {
          return '/dashboard';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/', builder: (_, __) => const LandingScreen()),
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
        GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
        GoRoute(
          path: '/reset-password',
          builder: (_, state) => ResetPasswordScreen(token: state.uri.queryParameters['token']),
        ),
        GoRoute(
          path: '/invite/accept',
          builder: (_, state) => AcceptInviteScreen(
            token: state.uri.queryParameters['token'],
            org: state.uri.queryParameters['org'],
          ),
        ),
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
            GoRoute(path: '/projects', builder: (_, __) => const ProjectsScreen()),
            GoRoute(path: '/project/create', builder: (_, __) => const ProjectCreateScreen()),
            GoRoute(
              path: '/project/:id',
              builder: (_, state) => ProjectDetailScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(path: '/teams', builder: (_, __) => const TeamsScreen()),
            GoRoute(
              path: '/team/:id',
              builder: (_, state) => TeamDetailScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(
              path: '/team/:id/meeting',
              builder: (_, state) => MeetingScreen(teamId: state.pathParameters['id']!),
            ),
            GoRoute(path: '/tasks', builder: (_, __) => const TasksScreen()),
            GoRoute(path: '/task/create', builder: (_, __) => const TaskEditScreen()),
            GoRoute(
              path: '/task/:id/edit',
              builder: (_, state) => TaskEditScreen(taskId: state.pathParameters['id']),
            ),
            GoRoute(path: '/exchange', builder: (_, __) => const ExchangeScreen()),
            GoRoute(
              path: '/exchange/:id',
              builder: (_, state) => ListingDetailScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(path: '/sessions', builder: (_, __) => const SessionsScreen()),
            GoRoute(
              path: '/sessions/:id',
              builder: (_, state) => SessionDetailScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(path: '/resources', builder: (_, __) => const ResourcesScreen()),
            GoRoute(path: '/leaderboard', builder: (_, __) => const LeaderboardScreen()),
            GoRoute(path: '/my-ratings', builder: (_, __) => const MyRatingsScreen()),
            GoRoute(path: '/skill-sharing', builder: (_, __) => const SkillSharingScreen()),
            GoRoute(
              path: '/chat',
              builder: (_, __) => const ChatScreen(),
            ),
            GoRoute(
              path: '/chat/:id',
              builder: (_, state) => ChatScreen(chatId: state.pathParameters['id']),
            ),
            GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
            GoRoute(
              path: '/profile/:userId',
              builder: (_, state) => ProfileScreen(userId: state.pathParameters['userId']),
            ),
            GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
            GoRoute(path: '/organisations', builder: (_, __) => const OrganisationsScreen()),
            GoRoute(path: '/organisations/create', builder: (_, __) => const CreateOrganisationScreen()),
            GoRoute(
              path: '/organisations/:id',
              builder: (_, state) => OrganisationDetailScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
            GoRoute(path: '/admin', builder: (_, __) => const AdminDashboardScreen()),
            GoRoute(path: '/admin/complaints', builder: (_, __) => const AdminComplaintsScreen()),
          ],
        ),
      ],
    );
  }
}
