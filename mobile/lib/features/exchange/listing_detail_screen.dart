import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class ListingDetailScreen extends StatefulWidget {
  const ListingDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  Map<String, dynamic>? _listing;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await context.read<AuthProvider>().api.getListing(widget.id);
    setState(() {
      _listing = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());
    final l = _listing!;
    return Scaffold(
      appBar: AppBar(title: Text(str(l['title']))),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: CollaborateCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AccentPill(label: str(l['type'])),
              const SizedBox(height: 12),
              Text(str(l['description'])),
            ],
          ),
        ),
      ),
    );
  }
}
