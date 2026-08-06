import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class ProjectDetailScreen extends StatefulWidget {
  const ProjectDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> with SafeLoadMixin {
  Map<String, dynamic>? _project;
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
      final data = await context.read<AuthProvider>().api.getProject(widget.id);
      if (mounted) setState(() => _project = data);
    });
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _delete() async {
    await context.read<AuthProvider>().api.deleteProject(widget.id);
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    if (_project == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Column(
          children: [
            if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
            const Expanded(child: EmptyState(title: 'Could not load project')),
          ],
        ),
      );
    }
    final p = _project!;
    return Scaffold(
      appBar: AppBar(
        title: Text(str(p['title'] ?? p['name'])),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (c) => AlertDialog(
                  title: const Text('Delete project?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                    TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Delete')),
                  ],
                ),
              );
              if (ok == true) await _delete();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                CollaborateCard(child: Text(str(p['description'], 'No description'))),
                const SizedBox(height: 12),
                if (p['goals'] != null)
                  CollaborateCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Goals', style: TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        Text(str(p['goals'])),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
