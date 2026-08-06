import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class SessionsScreen extends StatefulWidget {
  const SessionsScreen({super.key});
  @override
  State<SessionsScreen> createState() => _SessionsScreenState();
}

class _SessionsScreenState extends State<SessionsScreen> {
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await context.read<AuthProvider>().api.getBookingSessions();
    setState(() {
      _sessions = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const LoadingView()
          : RefreshIndicator(
              onRefresh: _load,
              child: _sessions.isEmpty
                  ? ListView(children: const [SizedBox(height: 120), EmptyState(title: 'No sessions')])
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _sessions.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final s = _sessions[i];
                        final id = pickId(s)!;
                        return CollaborateCard(
                          onTap: () => context.push('/sessions/$id'),
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(str(s['topic'] ?? s['title'], 'Session'), style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text(str(s['status'])),
                            trailing: AccentPill(label: str(s['status'], 'pending')),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
