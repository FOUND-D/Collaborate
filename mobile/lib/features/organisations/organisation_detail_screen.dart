import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class OrganisationDetailScreen extends StatefulWidget {
  const OrganisationDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<OrganisationDetailScreen> createState() => _OrganisationDetailScreenState();
}

class _OrganisationDetailScreenState extends State<OrganisationDetailScreen> with SafeLoadMixin {
  Map<String, dynamic>? _org;
  List<Map<String, dynamic>> _members = [];
  List<Map<String, dynamic>> _teams = [];
  List<Map<String, dynamic>> _roles = [];
  List<Map<String, dynamic>> _auditLog = [];
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
      final api = context.read<AuthProvider>().api;
      final org = await api.getOrganisation(widget.id);
      if (mounted) setState(() => _org = org);
      final members = await api.getOrgMembers(widget.id);
      final teams = await api.getOrgTeams(widget.id);
      if (mounted) setState(() {
        _members = members;
        _teams = teams;
      });
      final roles = await api.listOrgRoles(widget.id);
      final auditLog = await api.getOrgAuditLog(widget.id);
      if (mounted) setState(() {
        _roles = roles;
        _auditLog = auditLog;
      });
    });
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _invite() async {
    final email = TextEditingController();
    var role = 'member';
    await showDialog(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (context, setDialog) => AlertDialog(
          title: const Text('Invite member'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
              DropdownButton<String>(
                value: role,
                items: const [
                  DropdownMenuItem(value: 'member', child: Text('Member')),
                  DropdownMenuItem(value: 'admin', child: Text('Admin')),
                ],
                onChanged: (v) => setDialog(() => role = v ?? 'member'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                await context.read<AuthProvider>().api.inviteOrgMember(widget.id, email.text.trim(), role);
                if (c.mounted) Navigator.pop(c);
                await _load();
              },
              child: const Text('Invite'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    if (_org == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Column(
          children: [
            if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
            const Expanded(child: EmptyState(title: 'Could not load organisation')),
          ],
        ),
      );
    }
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(str(_org!['name'])),
          bottom: const TabBar(tabs: [
            Tab(text: 'Members'),
            Tab(text: 'Teams'),
            Tab(text: 'Roles'),
            Tab(text: 'Audit'),
          ]),
          actions: [IconButton(onPressed: _invite, icon: const Icon(Icons.person_add))],
        ),
        body: Column(
          children: [
            if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
            Expanded(
              child: TabBarView(
                children: [
                  ListView(
                    padding: const EdgeInsets.all(16),
                    children: _members.map((m) => ListTile(
                          leading: UserAvatar(name: str(m['name'] ?? m['user']?['name'])),
                          title: Text(str(m['name'] ?? m['user']?['name'])),
                          subtitle: Text(str(m['role'], 'member')),
                        )).toList(),
                  ),
                  ListView(
                    padding: const EdgeInsets.all(16),
                    children: _teams.map((t) => CollaborateCard(child: ListTile(title: Text(str(t['name']))))).toList(),
                  ),
                  ListView(
                    padding: const EdgeInsets.all(16),
                    children: _roles.map((r) => ListTile(title: Text(str(r['name'])), subtitle: Text(str(r['description'], '')))).toList(),
                  ),
                  ListView(
                    padding: const EdgeInsets.all(16),
                    children: _auditLog.map((e) => ListTile(
                          title: Text(str(e['action'])),
                          subtitle: Text(str(e['createdAt'])),
                        )).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
