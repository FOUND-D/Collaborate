import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});
  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic>? _stats;
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _topSkills = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<AuthProvider>().api;
    final results = await Future.wait([
      api.getAdminStats(),
      api.getAdminUsers(),
      api.getAdminTopSkills(),
    ]);
    setState(() {
      _stats = results[0] as Map<String, dynamic>;
      _users = results[1] as List<Map<String, dynamic>>;
      _topSkills = results[2] as List<Map<String, dynamic>>;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Admin'),
          bottom: const TabBar(tabs: [Tab(text: 'Overview'), Tab(text: 'Users')]),
        ),
        body: TabBarView(
          children: [
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_stats != null)
                  CollaborateCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: _stats!.entries.map((e) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [Text(str(e.key)), Text(str(e.value), style: const TextStyle(fontWeight: FontWeight.w700))],
                            ),
                          )).toList(),
                    ),
                  ),
                const SizedBox(height: 16),
                const SectionHeader(title: 'Top skills'),
                ..._topSkills.map((s) => ListTile(title: Text(str(s['name'] ?? s['_id'])), trailing: Text('${s['count'] ?? 0}'))),
              ],
            ),
            ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _users.length,
              itemBuilder: (_, i) {
                final u = _users[i];
                return CollaborateCard(
                  child: ListTile(
                    title: Text(str(u['name'])),
                    subtitle: Text(str(u['email'])),
                    trailing: PopupMenuButton<String>(
                      onSelected: (role) async {
                        await context.read<AuthProvider>().api.updateAdminUserRole(pickId(u)!, role);
                        await _load();
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'student', child: Text('Student')),
                        PopupMenuItem(value: 'faculty', child: Text('Faculty')),
                        PopupMenuItem(value: 'admin', child: Text('Admin')),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
