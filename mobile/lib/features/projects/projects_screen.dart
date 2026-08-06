import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  List<Map<String, dynamic>> _projects = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await context.read<AuthProvider>().api.getProjects();
      setState(() {
        _projects = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/project/create'),
        icon: const Icon(Icons.add),
        label: const Text('New project'),
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ListView(padding: const EdgeInsets.all(16), children: [ErrorBanner(message: _error!, onRetry: _load)])
              : _projects.isEmpty
                  ? const EmptyState(title: 'No projects yet', subtitle: 'Create your first project to get started.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _projects.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final p = _projects[i];
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
                      ),
                    ),
    );
  }
}
