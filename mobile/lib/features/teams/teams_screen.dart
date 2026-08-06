import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../providers/workspace_provider.dart';
import '../../widgets/shared_widgets.dart';

class TeamsScreen extends StatefulWidget {
  const TeamsScreen({super.key});
  @override
  State<TeamsScreen> createState() => _TeamsScreenState();
}

class _TeamsScreenState extends State<TeamsScreen> {
  final _name = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WorkspaceProvider>().loadTeams();
    });
  }

  Future<void> _create() async {
    if (_name.text.trim().isEmpty) return;
    await context.read<AuthProvider>().api.createTeam({'name': _name.text.trim()});
    _name.clear();
    if (mounted) await context.read<WorkspaceProvider>().loadTeams(forceRefresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final teams = workspace.teams;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showDialog(
          context: context,
          builder: (c) => AlertDialog(
            title: const Text('Create team'),
            content: TextField(controller: _name, decoration: const InputDecoration(labelText: 'Team name')),
            actions: [
              TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
              TextButton(onPressed: () async { Navigator.pop(c); await _create(); }, child: const Text('Create')),
            ],
          ),
        ),
        icon: const Icon(Icons.add),
        label: const Text('Team'),
      ),
      body: workspace.teamsLoading && teams.isEmpty
          ? const LoadingView()
          : RefreshIndicator(
              onRefresh: () => workspace.loadTeams(forceRefresh: true),
              child: teams.isEmpty
                  ? ListView(children: const [SizedBox(height: 120), EmptyState(title: 'No teams yet')])
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: teams.length,
                      itemBuilder: (_, i) {
                        final t = teams[i];
                        final id = pickId(t)!;
                        return CollaborateCard(
                          onTap: () => context.push('/team/$id'),
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(str(t['name']), style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text('${(t['members'] as List?)?.length ?? 0} members'),
                          ),
                        );
                      },
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                    ),
            ),
    );
  }
}
