import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../core/utils/safe_load_mixin.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class MeetingScreen extends StatefulWidget {
  const MeetingScreen({super.key, required this.teamId});
  final String teamId;

  @override
  State<MeetingScreen> createState() => _MeetingScreenState();
}

class _MeetingScreenState extends State<MeetingScreen> with SafeLoadMixin {
  Map<String, dynamic>? _meeting;
  final _agenda = TextEditingController();
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
      final data = await context.read<AuthProvider>().api.getMeeting(widget.teamId);
      if (mounted) {
        setState(() => _meeting = data);
        _agenda.text = str(data['agenda']);
      }
    });
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _start() async {
    await safeLoad(() async {
      final data = await context.read<AuthProvider>().api.startMeeting({'teamId': widget.teamId});
      if (mounted) {
        setState(() => _meeting = data);
        _agenda.text = str(data['agenda']);
      }
    });
  }

  Future<void> _end() async {
    if (_meeting == null) return;
    await context.read<AuthProvider>().api.endMeeting(pickId(_meeting)!);
    await _load();
  }

  Future<void> _saveAgenda() async {
    if (_meeting == null) return;
    await context.read<AuthProvider>().api.updateMeetingAgenda(pickId(_meeting)!, _agenda.text.trim());
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Agenda saved')));
  }

  Future<void> _summarise() async {
    if (_meeting == null) return;
    await context.read<AuthProvider>().api.summariseMeeting(pickId(_meeting)!);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Summary generated')));
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Team meeting')),
      body: Column(
        children: [
          if (loadErrorBanner(onRetry: _load) != null) loadErrorBanner(onRetry: _load)!,
          Expanded(
            child: _loading
                ? const LoadingView()
                : Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_meeting == null)
                          ElevatedButton(onPressed: _start, child: const Text('Start meeting'))
                        else ...[
                          CollaborateCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Status: ${str(_meeting!['status'], 'active')}', style: const TextStyle(fontWeight: FontWeight.w700)),
                                if (_meeting!['summary'] != null) ...[
                                  const SizedBox(height: 12),
                                  Text(str(_meeting!['summary'])),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(controller: _agenda, maxLines: 4, decoration: const InputDecoration(labelText: 'Agenda')),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              ElevatedButton(onPressed: _saveAgenda, child: const Text('Save agenda')),
                              const SizedBox(width: 8),
                              OutlinedButton(onPressed: _summarise, child: const Text('Summarise')),
                              const SizedBox(width: 8),
                              OutlinedButton(onPressed: _end, child: const Text('End')),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Video conferencing uses the same socket session as the web app. Join from your team page to collaborate in real time.',
                            style: TextStyle(fontSize: 13),
                          ),
                        ],
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
