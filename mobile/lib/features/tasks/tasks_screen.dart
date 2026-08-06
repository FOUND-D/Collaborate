import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/workspace_provider.dart';
import '../../widgets/shared_widgets.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});
  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WorkspaceProvider>().loadTasks();
    });
  }

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final tasks = workspace.tasks;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/task/create'),
        icon: const Icon(Icons.add),
        label: const Text('Task'),
      ),
      body: workspace.tasksLoading && tasks.isEmpty
          ? const LoadingView()
          : RefreshIndicator(
              onRefresh: () => workspace.loadTasks(forceRefresh: true),
              child: tasks.isEmpty
                  ? ListView(children: const [SizedBox(height: 120), EmptyState(title: 'No tasks')])
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: tasks.length,
                      itemBuilder: (_, i) {
                        final t = tasks[i];
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
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                    ),
            ),
    );
  }
}
