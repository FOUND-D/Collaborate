import 'package:flutter/material.dart';
import '../core/storage/auth_storage.dart';

class ThemeProvider extends ChangeNotifier {
  ThemeProvider() {
    _load();
  }

  final AuthStorage _storage = AuthStorage();
  ThemeMode _mode = ThemeMode.system;

  ThemeMode get mode => _mode;

  Future<void> _load() async {
    final saved = await _storage.getThemeMode();
    if (saved == 'light') _mode = ThemeMode.light;
    if (saved == 'dark') _mode = ThemeMode.dark;
    if (saved == 'system') _mode = ThemeMode.system;
    notifyListeners();
  }

  Future<void> setMode(ThemeMode mode) async {
    _mode = mode;
    final value = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      _ => 'system',
    };
    await _storage.saveThemeMode(value);
    notifyListeners();
  }
}
