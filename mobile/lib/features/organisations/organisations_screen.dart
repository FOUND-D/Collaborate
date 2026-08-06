import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class OrganisationsScreen extends StatefulWidget {
  const OrganisationsScreen({super.key});
  @override
  State<OrganisationsScreen> createState() => _OrganisationsScreenState();
}

class _OrganisationsScreenState extends State<OrganisationsScreen> {
  List<Map<String, dynamic>> _orgs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await context.read<AuthProvider>().api.getOrganisations();
    setState(() {
      _orgs = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/organisations/create'),
        icon: const Icon(Icons.add),
        label: const Text('Organisation'),
      ),
      body: _loading
          ? const LoadingView()
          : RefreshIndicator(
              onRefresh: _load,
              child: _orgs.isEmpty
                  ? ListView(children: const [SizedBox(height: 120), EmptyState(title: 'No organisations')])
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _orgs.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final o = _orgs[i];
                        return CollaborateCard(
                          onTap: () => context.push('/organisations/${pickId(o)}'),
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(str(o['name']), style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text(str(o['description'], '')),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
