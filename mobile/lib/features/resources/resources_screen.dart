import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});
  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> with SafeLoadMixin {
  List<Map<String, dynamic>> _resources = [];
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
      final data = await context.read<AuthProvider>().api.getResources();
      if (mounted) setState(() => _resources = data);
    });
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _add() async {
    final title = TextEditingController();
    final url = TextEditingController();
    await showDialog(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Add resource'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
            TextField(controller: url, decoration: const InputDecoration(labelText: 'URL')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              await context.read<AuthProvider>().api.createResource({
                'title': title.text.trim(),
                'url': url.text.trim(),
              });
              if (c.mounted) Navigator.pop(c);
              await _load();
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(onPressed: _add, icon: const Icon(Icons.add), label: const Text('Resource')),
      body: Column(
        children: [
          if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
          Expanded(
            child: _loading
                ? const LoadingView()
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _resources.isEmpty
                        ? ListView(children: const [SizedBox(height: 120), EmptyState(title: 'No resources')])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _resources.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (_, i) {
                              final r = _resources[i];
                              return CollaborateCard(
                                child: ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(str(r['title']), style: const TextStyle(fontWeight: FontWeight.w700)),
                                  subtitle: Text(str(r['url'])),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.auto_awesome),
                                    onPressed: () async {
                                      await context.read<AuthProvider>().api.summariseResource(pickId(r)!);
                                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Summary requested')));
                                    },
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
