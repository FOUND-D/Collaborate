import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});
  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<Map<String, dynamic>> _tasks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await context.read<AuthProvider>().api.getTasks();
    setState(() {
      _tasks = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/task/create'),
        icon: const Icon(Icons.add),
        label: const Text('Task'),
      ),
      body: _loading
          ? const LoadingView()
          : RefreshIndicator(
              onRefresh: _load,
              child: _tasks.isEmpty
                  ? ListView(children: const [SizedBox(height: 120), EmptyState(title: 'No tasks')])
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _tasks.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final t = _tasks[i];
                        final id = pickId(t)!;
                        return CollaborateCard(
                          onTap: () => context.push('/task/$id/edit'),
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(str(t['title']), style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text(str(t['description'], '')),
                            trailing: AccentPill(label: str(t['status'], 'Pending')),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
