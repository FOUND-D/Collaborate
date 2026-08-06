import 'package:flutter/material.dart';

/// Design tokens from web [theme.css].
class AppColors {
  // Light
  static const lightBgPrimary = Color(0xFFF5F3F0);
  static const lightBgCard = Color(0xFFFFFFFF);
  static const lightBgSecondary = Color(0xFFE9E6E1);
  static const lightBorder = Color(0xFFD4D0C8);
  static const lightTextPrimary = Color(0xFF1A1A1A);
  static const lightTextSecondary = Color(0xFF6B7280);

  // Dark
  static const darkBgPrimary = Color(0xFF0F1117);
  static const darkBgCard = Color(0xFF1C2128);
  static const darkBgSecondary = Color(0xFF161B22);
  static const darkBorder = Color(0xFF30363D);
  static const darkTextPrimary = Color(0xFFE6EDF3);
  static const darkTextSecondary = Color(0xFF8B949E);

  // Shared accents
  static const primary = Color(0xFF14B8A6);
  static const primaryHover = Color(0xFF0D9488);
  static const devScoreFrom = Color(0xFFF59E0B);
  static const devScoreTo = Color(0xFFEA580C);
  static const teams = Color(0xFF3B82F6);
  static const stars = Color(0xFFFBBF24);
  static const danger = Color(0xFFEF4444);
  static const purple = Color(0xFF8B5CF6);
  static const offerGreen = Color(0xFF10B981);

  static const accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryHover],
  );

  static const devScoreGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [devScoreFrom, devScoreTo],
  );
}
