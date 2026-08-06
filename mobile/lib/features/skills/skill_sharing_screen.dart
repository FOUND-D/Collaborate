import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class SkillSharingScreen extends StatefulWidget {
  const SkillSharingScreen({super.key});
  @override
  State<SkillSharingScreen> createState() => _SkillSharingScreenState();
}

class _SkillSharingScreenState extends State<SkillSharingScreen> with SafeLoadMixin {
  List<Map<String, dynamic>> _skills = [];
  List<Map<String, dynamic>> _matches = [];
  List<Map<String, dynamic>> _mySkills = [];
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
      final auth = context.read<AuthProvider>();
      final api = auth.api;
      final userId = auth.userId!;
      // Sequential loads — gentler on cold Render instances than parallel bursts.
      final mySkills = await api.getSkillsForUser(userId);
      if (mounted) setState(() => _mySkills = mySkills);
      final matches = await api.getSkillMatches();
      if (mounted) setState(() => _matches = matches);
      final skills = await api.getSkills();
      if (mounted) setState(() => _skills = skills);
    });
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _addSkill() async {
    final name = TextEditingController();
    var type = 'offer';
    await showDialog(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (context, setDialog) => AlertDialog(
          title: const Text('Add skill'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: name, decoration: const InputDecoration(labelText: 'Skill name')),
              DropdownButton<String>(
                value: type,
                items: const [
                  DropdownMenuItem(value: 'offer', child: Text('Can teach')),
                  DropdownMenuItem(value: 'want', child: Text('Want to learn')),
                ],
                onChanged: (v) => setDialog(() => type = v ?? 'offer'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                await context.read<AuthProvider>().api.createUserSkill({
                  'skillName': name.text.trim(),
                  'type': type,
                });
                if (c.mounted) Navigator.pop(c);
                await _load();
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(onPressed: _addSkill, icon: const Icon(Icons.add), label: const Text('Skill')),
      body: Column(
        children: [
          if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
          Expanded(
            child: _loading
                ? const LoadingView()
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: AppColors.accentGradient,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Text('Skill Sharing', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                        ),
                        const SizedBox(height: 16),
                        const SectionHeader(title: 'My skills'),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _mySkills.map((s) => Chip(
                                label: Text(str(s['skill']?['name'] ?? s['name'])),
                                deleteIcon: const Icon(Icons.close, size: 16),
                                onDeleted: () async {
                                  await context.read<AuthProvider>().api.deleteUserSkill(pickId(s)!, type: str(s['type']));
                                  await _load();
                                },
                              )).toList(),
                        ),
                        const SizedBox(height: 16),
                        const SectionHeader(title: 'Matches'),
                        ..._matches.map((m) => CollaborateCard(
                              onTap: () => context.push('/profile/${pickId(m['user'] ?? m)}'),
                              child: ListTile(
                                title: Text(str(m['name'] ?? m['user']?['name'])),
                                subtitle: Text('${m['matchScore'] ?? m['score'] ?? 0}% compatibility'),
                                trailing: const AccentPill(label: 'Match', color: AppColors.purple),
                              ),
                            )),
                        const SizedBox(height: 16),
                        const SectionHeader(title: 'All skills'),
                        ..._skills.take(20).map((s) => ListTile(
                              dense: true,
                              title: Text(str(s['name'])),
                              subtitle: Text('${s['userCount'] ?? 0} users'),
                            )),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
