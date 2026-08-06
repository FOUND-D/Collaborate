import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';

class TaskEditScreen extends StatefulWidget {
  const TaskEditScreen({super.key, this.taskId});
  final String? taskId;

  @override
  State<TaskEditScreen> createState() => _TaskEditScreenState();
}

class _TaskEditScreenState extends State<TaskEditScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  String _status = 'Pending';
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.taskId != null) _load();
  }

  Future<void> _load() async {
    final t = await context.read<AuthProvider>().api.getTask(widget.taskId!);
    _title.text = str(t['title']);
    _description.text = str(t['description']);
    _status = str(t['status'], 'Pending');
    setState(() {});
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    final api = context.read<AuthProvider>().api;
    final payload = {'title': _title.text.trim(), 'description': _description.text.trim(), 'status': _status};
    try {
      if (widget.taskId == null) {
        await api.createTask(payload);
      } else {
        await api.updateTask(widget.taskId!, payload);
      }
      if (mounted) context.pop();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _delete() async {
    if (widget.taskId == null) return;
    await context.read<AuthProvider>().api.deleteTask(widget.taskId!);
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.taskId == null ? 'Create task' : 'Edit task'),
        actions: [
          if (widget.taskId != null)
            IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: _delete),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          TextField(controller: _description, maxLines: 4, decoration: const InputDecoration(labelText: 'Description')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _status,
            decoration: const InputDecoration(labelText: 'Status'),
            items: const [
              DropdownMenuItem(value: 'Pending', child: Text('Pending')),
              DropdownMenuItem(value: 'In Progress', child: Text('In Progress')),
              DropdownMenuItem(value: 'Completed', child: Text('Completed')),
              DropdownMenuItem(value: 'Blocked', child: Text('Blocked')),
            ],
            onChanged: (v) => setState(() => _status = v ?? 'Pending'),
          ),
          const SizedBox(height: 20),
          ElevatedButton(onPressed: _loading ? null : _save, child: const Text('Save')),
        ],
      ),
    );
  }
}
