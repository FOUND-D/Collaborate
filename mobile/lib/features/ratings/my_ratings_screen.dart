import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class MyRatingsScreen extends StatefulWidget {
  const MyRatingsScreen({super.key});
  @override
  State<MyRatingsScreen> createState() => _MyRatingsScreenState();
}

class _MyRatingsScreenState extends State<MyRatingsScreen> with SafeLoadMixin {
  List<Map<String, dynamic>> _ratings = [];
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
      final userId = context.read<AuthProvider>().userId;
      if (userId == null) return;
      final data = await context.read<AuthProvider>().api.getRatings(userId);
      if (mounted) setState(() => _ratings = data);
    });
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
          Expanded(
            child: _loading
                ? const LoadingView()
                : _ratings.isEmpty
                    ? const EmptyState(title: 'No ratings yet')
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _ratings.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (_, i) {
                            final r = _ratings[i];
                            final stars = (r['rating'] as num?)?.toInt() ?? 0;
                            return CollaborateCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: List.generate(5, (j) => Icon(
                                          j < stars ? Icons.star : Icons.star_border,
                                          color: AppColors.stars,
                                          size: 18,
                                        )),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(str(r['comment'], 'No comment')),
                                  const SizedBox(height: 4),
                                  Text('From ${str(r['reviewer']?['name'] ?? r['reviewerName'])}', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
                                ],
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
