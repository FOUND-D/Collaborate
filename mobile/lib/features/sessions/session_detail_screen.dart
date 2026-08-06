import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class SessionDetailScreen extends StatefulWidget {
  const SessionDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<SessionDetailScreen> createState() => _SessionDetailScreenState();
}

class _SessionDetailScreenState extends State<SessionDetailScreen> {
  Map<String, dynamic>? _session;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final sessions = await context.read<AuthProvider>().api.getBookingSessions();
    final match = sessions.firstWhere((s) => pickId(s) == widget.id, orElse: () => {});
    setState(() => _session = match.isEmpty ? null : match);
  }

  @override
  Widget build(BuildContext context) {
    if (_session == null) return const Scaffold(body: LoadingView());
    final s = _session!;
    return Scaffold(
      appBar: AppBar(title: const Text('Session')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: CollaborateCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(str(s['topic'] ?? s['title']), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
              const SizedBox(height: 8),
              Text('Status: ${str(s['status'])}'),
              const SizedBox(height: 16),
              Row(
                children: [
                  if (str(s['status']).toLowerCase() == 'pending')
                    ElevatedButton(
                      onPressed: () async {
                        await context.read<AuthProvider>().api.confirmSession(widget.id);
                        await _load();
                      },
                      child: const Text('Confirm'),
                    ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () async {
                      await context.read<AuthProvider>().api.cancelSession(widget.id);
                      await _load();
                    },
                    child: const Text('Cancel'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
