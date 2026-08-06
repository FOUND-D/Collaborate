import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/workspace_provider.dart';
import '../../widgets/shared_widgets.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WorkspaceProvider>().loadProjects();
    });
  }

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final projects = workspace.projects;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/project/create'),
        icon: const Icon(Icons.add),
        label: const Text('New project'),
      ),
      body: workspace.projectsLoading && projects.isEmpty
          ? const LoadingView()
          : projects.isEmpty
              ? const EmptyState(title: 'No projects yet', subtitle: 'Create your first project to get started.')
              : RefreshIndicator(
                  onRefresh: () => workspace.loadProjects(forceRefresh: true),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: projects.length,
                    itemBuilder: (context, i) {
                      final p = projects[i];
                      final id = pickId(p)!;
                      return CollaborateCard(
                        onTap: () => context.push('/project/$id'),
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(str(p['title'] ?? p['name']), style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(str(p['description'], 'No description')),
                          trailing: AccentPill(label: str(p['status'], 'active')),
                        ),
                      );
                    },
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                  ),
                ),
    );
  }
}
