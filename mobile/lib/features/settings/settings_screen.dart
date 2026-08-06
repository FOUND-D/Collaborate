import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/shared_widgets.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _bio = TextEditingController();
  final _github = TextEditingController();
  final _leetcode = TextEditingController();
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final profile = await context.read<AuthProvider>().api.getUserProfile();
    _bio.text = str(profile['bio']);
    _github.text = str(profile['githubUsername']);
    _leetcode.text = str(profile['leetcodeUsername']);
    setState(() => _loading = false);
  }

  Future<void> _saveProfile() async {
    await context.read<AuthProvider>().api.updateProfile({
      'bio': _bio.text.trim(),
      'githubUsername': _github.text.trim(),
      'leetcodeUsername': _leetcode.text.trim(),
    });
    await context.read<AuthProvider>().refreshUser();
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();
    if (_loading) return const Scaffold(body: LoadingView());
    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(title: 'Appearance'),
          SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(value: ThemeMode.system, label: Text('System')),
              ButtonSegment(value: ThemeMode.light, label: Text('Light')),
              ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
            ],
            selected: {theme.mode},
            onSelectionChanged: (s) => theme.setMode(s.first),
          ),
          const SizedBox(height: 20),
          const SectionHeader(title: 'Profile'),
          TextField(controller: _bio, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio')),
          const SizedBox(height: 12),
          TextField(controller: _github, decoration: const InputDecoration(labelText: 'GitHub username')),
          const SizedBox(height: 12),
          TextField(controller: _leetcode, decoration: const InputDecoration(labelText: 'LeetCode username')),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: _saveProfile, child: const Text('Save profile')),
          const SizedBox(height: 24),
          const SectionHeader(title: 'Password'),
          TextField(controller: _currentPassword, decoration: const InputDecoration(labelText: 'Current password'), obscureText: true),
          const SizedBox(height: 12),
          TextField(controller: _newPassword, decoration: const InputDecoration(labelText: 'New password'), obscureText: true),
        ],
      ),
    );
  }
}
