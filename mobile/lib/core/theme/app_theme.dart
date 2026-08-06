import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData light() => _build(Brightness.light);
  static ThemeData dark() => _build(Brightness.dark);

  static const _fontFamily = 'Segoe UI';

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final bg = isDark ? AppColors.darkBgPrimary : AppColors.lightBgPrimary;
    final card = isDark ? AppColors.darkBgCard : AppColors.lightBgCard;
    final secondary = isDark ? AppColors.darkBgSecondary : AppColors.lightBgSecondary;
    final border = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;
    final textSecondary = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;

    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      fontFamily: _fontFamily,
      fontFamilyFallback: const ['Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: brightness,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        surface: card,
        onSurface: textPrimary,
        error: AppColors.danger,
      ),
      dividerColor: border,
      textTheme: TextTheme(
        bodyLarge: TextStyle(color: textPrimary, fontFamily: _fontFamily),
        bodyMedium: TextStyle(color: textPrimary, fontFamily: _fontFamily),
        titleLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.w700, fontFamily: _fontFamily),
        titleMedium: TextStyle(color: textPrimary, fontWeight: FontWeight.w600, fontFamily: _fontFamily),
        headlineSmall: TextStyle(color: textPrimary, fontWeight: FontWeight.w800, fontFamily: _fontFamily),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: card,
        foregroundColor: textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: textPrimary,
          fontFamily: _fontFamily,
        ),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        hintStyle: TextStyle(color: textSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontFamily: _fontFamily),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textPrimary,
          side: BorderSide(color: border),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      navigationDrawerTheme: NavigationDrawerThemeData(
        backgroundColor: secondary,
        indicatorColor: AppColors.primary.withValues(alpha: 0.12),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(fontWeight: FontWeight.w600, color: AppColors.primary, fontFamily: _fontFamily);
          }
          return TextStyle(color: textSecondary, fontFamily: _fontFamily);
        }),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: secondary,
        labelStyle: const TextStyle(fontSize: 12, fontFamily: _fontFamily),
        side: BorderSide(color: border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
    );

    return base;
  }
}
