import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class SkillSharingScreen extends StatefulWidget {
  const SkillSharingScreen({super.key});
  @override
  State<SkillSharingScreen> createState() => _SkillSharingScreenState();
}

class _SkillSharingScreenState extends State<SkillSharingScreen> {
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
    final auth = context.read<AuthProvider>();
    final userId = auth.userId!;
    final results = await Future.wait([
      auth.api.getSkills(),
      auth.api.getSkillMatches(),
      auth.api.getSkillsForUser(userId),
    ]);
    setState(() {
      _skills = results[0] as List<Map<String, dynamic>>;
      _matches = results[1] as List<Map<String, dynamic>>;
      _mySkills = results[2] as List<Map<String, dynamic>>;
      _loading = false;
    });
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
    if (_loading) return const Scaffold(body: LoadingView());
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(onPressed: _addSkill, icon: const Icon(Icons.add), label: const Text('Skill')),
      body: RefreshIndicator(
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
    );
  }
}
