import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class AcceptInviteScreen extends StatefulWidget {
  const AcceptInviteScreen({super.key, this.token, this.org});
  final String? token;
  final String? org;

  @override
  State<AcceptInviteScreen> createState() => _AcceptInviteScreenState();
}

class _AcceptInviteScreenState extends State<AcceptInviteScreen> {
  bool _loading = false;
  String? _error;
  String? _message;

  Future<void> _accept() async {
    if (widget.token == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().api.acceptOrgInvite(widget.token!, org: widget.org);
      await context.read<AuthProvider>().refreshMembership();
      setState(() => _message = 'Invite accepted!');
      if (mounted) Future.delayed(const Duration(seconds: 1), () => context.go('/organisations'));
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Accept invite')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text('You have been invited to join an organisation.'),
            if (_message != null) Text(_message!),
            if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _loading ? null : _accept,
              child: _loading ? const CircularProgressIndicator() : const Text('Accept invite'),
            ),
          ],
        ),
      ),
    );
  }
}
