import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class ExchangeScreen extends StatefulWidget {
  const ExchangeScreen({super.key});
  @override
  State<ExchangeScreen> createState() => _ExchangeScreenState();
}

class _ExchangeScreenState extends State<ExchangeScreen> {
  List<Map<String, dynamic>> _listings = [];
  String? _typeFilter;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await context.read<AuthProvider>().api.getListings(type: _typeFilter);
    setState(() {
      _listings = data;
      _loading = false;
    });
  }

  Future<void> _create() async {
    final title = TextEditingController();
    final desc = TextEditingController();
    var type = 'offer';
    await showDialog(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (context, setDialog) => AlertDialog(
          title: const Text('New listing'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
              TextField(controller: desc, decoration: const InputDecoration(labelText: 'Description')),
              DropdownButton<String>(
                value: type,
                items: const [
                  DropdownMenuItem(value: 'offer', child: Text('Offer')),
                  DropdownMenuItem(value: 'request', child: Text('Request')),
                ],
                onChanged: (v) => setDialog(() => type = v ?? 'offer'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                await context.read<AuthProvider>().api.createListing({
                  'title': title.text.trim(),
                  'description': desc.text.trim(),
                  'type': type,
                });
                if (c.mounted) Navigator.pop(c);
                await _load();
              },
              child: const Text('Post'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(onPressed: _create, icon: const Icon(Icons.add), label: const Text('Listing')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                FilterChip(label: const Text('All'), selected: _typeFilter == null, onSelected: (_) { setState(() => _typeFilter = null); _load(); }),
                const SizedBox(width: 8),
                FilterChip(label: const Text('Offers'), selected: _typeFilter == 'offer', onSelected: (_) { setState(() => _typeFilter = 'offer'); _load(); }),
                const SizedBox(width: 8),
                FilterChip(label: const Text('Requests'), selected: _typeFilter == 'request', onSelected: (_) { setState(() => _typeFilter = 'request'); _load(); }),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingView()
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _listings.isEmpty
                        ? ListView(children: const [SizedBox(height: 120), EmptyState(title: 'No listings')])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _listings.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (_, i) {
                              final l = _listings[i];
                              final isOffer = str(l['type']) == 'offer';
                              return CollaborateCard(
                                onTap: () => context.push('/exchange/${pickId(l)}'),
                                child: ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(str(l['title']), style: const TextStyle(fontWeight: FontWeight.w700)),
                                  subtitle: Text(str(l['description'])),
                                  trailing: AccentPill(
                                    label: isOffer ? 'Offer' : 'Request',
                                    color: isOffer ? AppColors.offerGreen : AppColors.devScoreFrom,
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
