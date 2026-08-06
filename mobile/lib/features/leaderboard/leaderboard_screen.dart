import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});
  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> with SafeLoadMixin {
  List<Map<String, dynamic>> _users = [];
  bool _nearbyOnly = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    await safeLoad(() async {
      final data = await context.read<AuthProvider>().api.getLeaderboard(nearbyOnly: _nearbyOnly);
      if (mounted) setState(() => _users = data);
    });
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
          Padding(
            padding: const EdgeInsets.all(12),
            child: FilterChip(
              label: const Text('Nearby only'),
              selected: _nearbyOnly,
              onSelected: (v) {
                setState(() => _nearbyOnly = v);
                _load();
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _users.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final u = _users[i];
                        final rank = i + 1;
                        Color? trophy;
                        if (rank == 1) trophy = const Color(0xFFFFD700);
                        if (rank == 2) trophy = const Color(0xFFC0C0C0);
                        if (rank == 3) trophy = const Color(0xFFCD7F32);
                        return CollaborateCard(
                          onTap: () => context.push('/profile/${pickId(u)}'),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: trophy?.withValues(alpha: 0.2) ?? AppColors.primary.withValues(alpha: 0.1),
                              child: Text('$rank', style: TextStyle(fontWeight: FontWeight.w800, color: trophy ?? AppColors.primary)),
                            ),
                            title: Text(str(u['name']), style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text(str(u['department'], '')),
                            trailing: Text('${u['devScore'] ?? 0}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 18)),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
