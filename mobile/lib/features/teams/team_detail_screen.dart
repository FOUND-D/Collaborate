import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class TeamDetailScreen extends StatefulWidget {
  const TeamDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<TeamDetailScreen> createState() => _TeamDetailScreenState();
}

class _TeamDetailScreenState extends State<TeamDetailScreen> {
  Map<String, dynamic>? _team;
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    context.read<AuthProvider>().socketService.joinTeamRoom(widget.id);
  }

  Future<void> _load() async {
    final api = context.read<AuthProvider>().api;
    final team = await api.getTeam(widget.id);
    final sessions = await api.getTeamSessions(widget.id);
    setState(() {
      _team = team;
      _sessions = sessions;
      _loading = false;
    });
  }

  Future<void> _startSession() async {
    await context.read<AuthProvider>().api.startTeamSession(widget.id);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    final team = _team!;
    final members = asMapList(team['members']);
    return Scaffold(
      appBar: AppBar(
        title: Text(str(team['name'])),
        actions: [
          IconButton(icon: const Icon(Icons.videocam), onPressed: () => context.push('/team/${widget.id}/meeting')),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ElevatedButton.icon(onPressed: _startSession, icon: const Icon(Icons.play_arrow), label: const Text('Start session')),
          const SizedBox(height: 16),
          const SectionHeader(title: 'Members'),
          ...members.map((m) => ListTile(
                leading: UserAvatar(name: str(m['name'])),
                title: Text(str(m['name'])),
                subtitle: Text(str(m['role'], 'member')),
                onTap: () => context.push('/profile/${pickId(m)}'),
              )),
          const SectionHeader(title: 'Sessions'),
          if (_sessions.isEmpty) const Text('No sessions yet'),
          ..._sessions.map((s) => CollaborateCard(
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(str(s['status'], 'session')),
                  subtitle: Text(str(s['createdAt'])),
                ),
              )),
        ],
      ),
    );
  }
}
