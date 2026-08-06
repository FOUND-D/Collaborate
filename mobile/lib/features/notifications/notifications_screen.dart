import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> with SafeLoadMixin {
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().socketService.onNewNotification((_) => _load());
    });
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    await safeLoad(() async {
      final data = await context.read<AuthProvider>().api.getNotifications();
      if (mounted) setState(() => _notifications = data);
    });
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await context.read<AuthProvider>().api.markAllNotificationsRead();
              await _load();
            },
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: Column(
        children: [
          if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
          Expanded(
            child: _loading
                ? const LoadingView()
                : _notifications.isEmpty
                    ? const EmptyState(title: 'No notifications')
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _notifications.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (_, i) {
                            final n = _notifications[i];
                            final read = n['read'] == true;
                            return CollaborateCard(
                              child: ListTile(
                                title: Text(str(n['title']), style: TextStyle(fontWeight: read ? FontWeight.normal : FontWeight.w700)),
                                subtitle: Text(str(n['message'] ?? n['body'], '')),
                                onTap: () async {
                                  await context.read<AuthProvider>().api.markNotificationRead(pickId(n)!);
                                  await _load();
                                },
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
