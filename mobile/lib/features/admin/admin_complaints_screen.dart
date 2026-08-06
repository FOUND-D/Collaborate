import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class AdminComplaintsScreen extends StatefulWidget {
  const AdminComplaintsScreen({super.key});
  @override
  State<AdminComplaintsScreen> createState() => _AdminComplaintsScreenState();
}

class _AdminComplaintsScreenState extends State<AdminComplaintsScreen> with SafeLoadMixin {
  List<Map<String, dynamic>> _complaints = [];
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
      final data = await context.read<AuthProvider>().api.getComplaints();
      if (mounted) setState(() => _complaints = data);
    });
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Complaints')),
      body: Column(
        children: [
          if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
          Expanded(
            child: _loading
                ? const LoadingView()
                : _complaints.isEmpty
                    ? const EmptyState(title: 'No complaints')
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _complaints.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (_, i) {
                            final c = _complaints[i];
                            final id = pickId(c)!;
                            return CollaborateCard(
                              child: ListTile(
                                title: Text(str(c['reason'] ?? c['type'])),
                                subtitle: Text(str(c['description'], '')),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.check),
                                      onPressed: () async {
                                        await context.read<AuthProvider>().api.resolveComplaint(id);
                                        await _load();
                                      },
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete, color: Colors.red),
                                      onPressed: () async {
                                        await context.read<AuthProvider>().api.deleteComplaint(id);
                                        await _load();
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
