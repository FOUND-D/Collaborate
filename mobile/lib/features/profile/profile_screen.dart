import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/media_url.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, this.userId});
  final String? userId;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  List<Map<String, dynamic>> _badges = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final id = widget.userId ?? auth.userId!;
    final user = widget.userId == null ? await auth.api.getUserProfile() : await auth.api.getUserById(id);
    final badges = await auth.api.getUserBadges(id);
    setState(() {
      _user = user;
      _badges = badges;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    final u = _user!;
    final isSelf = widget.userId == null || widget.userId == context.read<AuthProvider>().userId;
    return Scaffold(
      appBar: AppBar(
        title: Text(str(u['name'])),
        actions: [
          if (!isSelf)
            IconButton(
              icon: const Icon(Icons.chat_bubble_outline),
              onPressed: () => context.push('/chat/${pickId(u)}'),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: UserAvatar(
              name: str(u['name']),
              imageUrl: resolveMediaUrl(str(u['profileImage'])),
              radius: 48,
            ),
          ),
          const SizedBox(height: 12),
          Center(child: Text(str(u['name']), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800))),
          Center(child: Text(str(u['department'], ''), style: TextStyle(color: Theme.of(context).hintColor))),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: CollaborateCard(gradient: AppColors.devScoreGradient, child: Column(children: [const Text('Dev Score', style: TextStyle(color: Colors.white70)), Text('${u['devScore'] ?? 0}', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800))]))),
              const SizedBox(width: 12),
              Expanded(child: CollaborateCard(child: Column(children: [Text('Rating', style: TextStyle(color: Theme.of(context).hintColor)), Text(u['avg_rating'] != null ? (u['avg_rating'] as num).toStringAsFixed(1) : '—', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800))]))),
            ],
          ),
          if (u['bio'] != null && str(u['bio']).isNotEmpty) ...[
            const SizedBox(height: 16),
            CollaborateCard(child: Text(str(u['bio']))),
          ],
          if (_badges.isNotEmpty) ...[
            const SizedBox(height: 16),
            const SectionHeader(title: 'Badges'),
            Wrap(
              spacing: 8,
              children: _badges.map((b) => Chip(label: Text(str(b['name'] ?? b['title'])))).toList(),
            ),
          ],
          if (isSelf) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await context.read<AuthProvider>().api.refreshDevScore();
                await _load();
                await context.read<AuthProvider>().refreshUser();
              },
              child: const Text('Refresh Dev Score'),
            ),
          ],
        ],
      ),
    );
  }
}
