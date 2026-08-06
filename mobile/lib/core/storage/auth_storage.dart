import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class AuthStorage {
  static const _userKey = 'userInfo';
  static const _themeKey = 'themeMode';
  static const _orgKey = 'currentOrgId';

  Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user));
  }

  Future<void> clearUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  Future<String?> getThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_themeKey);
  }

  Future<void> saveThemeMode(String mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode);
  }

  Future<String?> getCurrentOrgId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_orgKey);
  }

  Future<void> saveCurrentOrgId(String? orgId) async {
    final prefs = await SharedPreferences.getInstance();
    if (orgId == null) {
      await prefs.remove(_orgKey);
    } else {
      await prefs.setString(_orgKey, orgId);
    }
  }
}
