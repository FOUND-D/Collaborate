import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class CreateOrganisationScreen extends StatefulWidget {
  const CreateOrganisationScreen({super.key});
  @override
  State<CreateOrganisationScreen> createState() => _CreateOrganisationScreenState();
}

class _CreateOrganisationScreenState extends State<CreateOrganisationScreen> {
  final _name = TextEditingController();
  final _description = TextEditingController();
  bool _loading = false;

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      final org = await context.read<AuthProvider>().api.createOrganisation({
        'name': _name.text.trim(),
        'description': _description.text.trim(),
      });
      await context.read<AuthProvider>().refreshMembership();
      if (mounted) context.go('/organisations/${org['_id'] ?? org['id']}');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create organisation')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name')),
            const SizedBox(height: 12),
            TextField(controller: _description, maxLines: 3, decoration: const InputDecoration(labelText: 'Description')),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: _loading ? null : _submit, child: const Text('Create')),
          ],
        ),
      ),
    );
  }
}
