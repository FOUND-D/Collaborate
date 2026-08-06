import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/workspace_provider.dart';
import '../../widgets/shared_widgets.dart';

class OrganisationsScreen extends StatefulWidget {
  const OrganisationsScreen({super.key});
  @override
  State<OrganisationsScreen> createState() => _OrganisationsScreenState();
}

class _OrganisationsScreenState extends State<OrganisationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WorkspaceProvider>().loadOrganisations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final orgs = workspace.organisations;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/organisations/create'),
        icon: const Icon(Icons.add),
        label: const Text('Organisation'),
      ),
      body: workspace.organisationsLoading && orgs.isEmpty
          ? const LoadingView()
          : RefreshIndicator(
              onRefresh: () => workspace.loadOrganisations(forceRefresh: true),
              child: orgs.isEmpty
                  ? ListView(children: const [SizedBox(height: 120), EmptyState(title: 'No organisations')])
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: orgs.length,
                      itemBuilder: (_, i) {
                        final o = orgs[i];
                        return CollaborateCard(
                          onTap: () => context.push('/organisations/${pickId(o)}'),
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(str(o['name']), style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text(str(o['description'], '')),
                          ),
                        );
                      },
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                    ),
            ),
    );
  }
}
