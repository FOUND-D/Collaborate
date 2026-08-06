import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  List<Map<String, dynamic>> _matches = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<AuthProvider>().api;
    try {
      final results = await Future.wait([
        api.getUserStats(),
        api.getSkillMatches(),
        api.getProjects(),
        api.getTasks(),
      ]);
      setState(() {
        _stats = results[0] as Map<String, dynamic>;
        _matches = results[1] as List<Map<String, dynamic>>;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Morning';
    if (h < 18) return 'Afternoon';
    return 'Evening';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final name = str(user?['name']).split(' ').first;

    if (_loading) return const LoadingView(message: 'Loading workspace...');

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (auth.currentOrg == null)
            CollaborateCard(
              child: Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('No organisation yet', style: TextStyle(fontWeight: FontWeight.w700)),
                        SizedBox(height: 4),
                        Text('Create or join one to unlock collaboration.'),
                      ],
                    ),
                  ),
                  ElevatedButton(onPressed: () => context.push('/organisations/create'), child: const Text('Create')),
                ],
              ),
            ),
          const SizedBox(height: 16),
          Text('Good ${_greeting()}, $name', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text("Here's what's happening in your workspace today.", style: TextStyle(color: Theme.of(context).hintColor)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: CollaborateCard(
                  gradient: AppColors.devScoreGradient,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Dev Score', style: TextStyle(color: Colors.white70)),
                      Text('${user?['devScore'] ?? 0}', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: CollaborateCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Rating', style: TextStyle(color: Theme.of(context).hintColor)),
                      Text(
                        user?['avg_rating'] != null ? (user!['avg_rating'] as num).toStringAsFixed(1) : '—',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Quick actions'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(label: const Text('Projects'), onPressed: () => context.go('/projects')),
              ActionChip(label: const Text('Teams'), onPressed: () => context.go('/teams')),
              ActionChip(label: const Text('Tasks'), onPressed: () => context.go('/tasks')),
              ActionChip(label: const Text('Exchange'), onPressed: () => context.go('/exchange')),
              ActionChip(label: const Text('Chat'), onPressed: () => context.go('/chat')),
            ],
          ),
          if (_stats != null) ...[
            const SizedBox(height: 16),
            const SectionHeader(title: 'Your stats'),
            CollaborateCard(
              child: Column(
                children: [
                  _statRow('Projects', str(_stats!['projectCount'], '0')),
                  _statRow('Open tasks', str(_stats!['openTasks'], '0')),
                  _statRow('Completion rate', '${_stats!['completionRate'] ?? 0}%'),
                ],
              ),
            ),
          ],
          if (_matches.isNotEmpty) ...[
            const SizedBox(height: 16),
            SectionHeader(title: 'Skill matches', action: TextButton(onPressed: () => context.go('/skill-sharing'), child: const Text('View all'))),
            ..._matches.take(3).map((m) => CollaborateCard(
                  onTap: () => context.push('/profile/${pickId(m['user'] ?? m)}'),
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(str(m['name'] ?? m['user']?['name'])),
                    subtitle: Text('${m['matchScore'] ?? m['score'] ?? 0}% match'),
                    trailing: const AccentPill(label: 'Match'),
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label), Text(value, style: const TextStyle(fontWeight: FontWeight.w700))],
      ),
    );
  }
}
