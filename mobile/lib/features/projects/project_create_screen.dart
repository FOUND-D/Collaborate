import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class ProjectCreateScreen extends StatefulWidget {
  const ProjectCreateScreen({super.key});

  @override
  State<ProjectCreateScreen> createState() => _ProjectCreateScreenState();
}

class _ProjectCreateScreenState extends State<ProjectCreateScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _prompt = TextEditingController();
  bool _useAi = false;
  bool _loading = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _prompt.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    final api = context.read<AuthProvider>().api;
    try {
      final data = _useAi
          ? await api.createProjectWithAi({'prompt': _prompt.text.trim()})
          : await api.createProject({'title': _title.text.trim(), 'description': _description.text.trim()});
      if (mounted) context.go('/project/${data['_id'] ?? data['id']}');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create project')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            title: const Text('Create with AI'),
            value: _useAi,
            onChanged: (v) => setState(() => _useAi = v),
          ),
          if (_useAi)
            TextField(controller: _prompt, maxLines: 4, decoration: const InputDecoration(labelText: 'Describe your project'))
          else ...[
            TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 12),
            TextField(controller: _description, maxLines: 4, decoration: const InputDecoration(labelText: 'Description')),
          ],
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create'),
          ),
        ],
      ),
    );
  }
}
