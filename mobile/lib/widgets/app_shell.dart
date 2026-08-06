import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../core/theme/app_colors.dart';
import '../core/utils/json_helpers.dart';
import '../core/utils/media_url.dart';
import '../providers/auth_provider.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  static const _routes = <_NavItem>[
    _NavItem('/dashboard', Icons.dashboard_outlined, 'Dashboard'),
    _NavItem('/projects', Icons.folder_outlined, 'Projects'),
    _NavItem('/teams', Icons.groups_outlined, 'Teams'),
    _NavItem('/tasks', Icons.task_alt_outlined, 'Tasks'),
    _NavItem('/exchange', Icons.swap_horiz, 'Exchange'),
    _NavItem('/sessions', Icons.videocam_outlined, 'Sessions'),
    _NavItem('/resources', Icons.folder_open_outlined, 'Resources'),
    _NavItem('/leaderboard', Icons.emoji_events_outlined, 'Leaderboard'),
    _NavItem('/my-ratings', Icons.star_outline, 'My Ratings'),
    _NavItem('/skill-sharing', Icons.psychology_outlined, 'Skill Sharing'),
    _NavItem('/chat', Icons.chat_bubble_outline, 'Chat'),
    _NavItem('/organisations', Icons.business_outlined, 'Organisations'),
    _NavItem('/settings', Icons.settings_outlined, 'Settings'),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final location = GoRouterState.of(context).uri.toString();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: AppColors.accentGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.business, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 10),
            Text(AppConfig.appName),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              if (user != null)
                ListTile(
                  leading: UserAvatar(
                    name: str(user['name']),
                    imageUrl: resolveMediaUrl(str(user['profileImage'])),
                    radius: 22,
                  ),
                  title: Text(str(user['name']), style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text('${str(user['role'], 'member')} · Dev ${user['devScore'] ?? 0}'),
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/profile');
                  },
                ),
              if (auth.currentOrg != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Chip(
                      avatar: const Icon(Icons.business, size: 16),
                      label: Text(str(auth.currentOrg!['name'])),
                    ),
                  ),
                ),
              const Divider(),
              Expanded(
                child: ListView(
                  children: [
                    for (final item in _routes)
                      ListTile(
                        leading: Icon(item.icon),
                        title: Text(item.label),
                        selected: location.startsWith(item.path),
                        onTap: () {
                          Navigator.pop(context);
                          context.go(item.path);
                        },
                      ),
                    if (auth.isAdmin) ...[
                      const Divider(),
                      ListTile(
                        leading: const Icon(Icons.shield_outlined),
                        title: const Text('Admin'),
                        selected: location.startsWith('/admin'),
                        onTap: () {
                          Navigator.pop(context);
                          context.go('/admin');
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.flag_outlined),
                        title: const Text('Complaints'),
                        selected: location.startsWith('/admin/complaints'),
                        onTap: () {
                          Navigator.pop(context);
                          context.go('/admin/complaints');
                        },
                      ),
                    ],
                  ],
                ),
              ),
              ListTile(
                leading: const Icon(Icons.logout, color: AppColors.danger),
                title: const Text('Logout', style: TextStyle(color: AppColors.danger)),
                onTap: () async {
                  await auth.logout();
                  if (context.mounted) context.go('/login');
                },
              ),
            ],
          ),
        ),
      ),
      body: child,
    );
  }
}

class _NavItem {
  const _NavItem(this.path, this.icon, this.label);
  final String path;
  final IconData icon;
  final String label;
}

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, this.name, this.imageUrl, this.radius = 20});
  final String? name;
  final String? imageUrl;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final initial = (name?.isNotEmpty == true) ? name!.substring(0, 1).toUpperCase() : '?';
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return CircleAvatar(radius: radius, backgroundImage: NetworkImage(imageUrl!));
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.primary.withValues(alpha: 0.15),
      child: Text(initial, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
    );
  }
}
