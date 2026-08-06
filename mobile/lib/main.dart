import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/workspace_provider.dart';
import 'router/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = true;
  runApp(const CollaborateApp());
}

class CollaborateApp extends StatefulWidget {
  const CollaborateApp({super.key});

  @override
  State<CollaborateApp> createState() => _CollaborateAppState();
}

class _CollaborateAppState extends State<CollaborateApp> {
  late final AuthProvider _authProvider;
  late final ThemeProvider _themeProvider;
  late final WorkspaceProvider _workspaceProvider;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();
    _themeProvider = ThemeProvider();
    _workspaceProvider = WorkspaceProvider(_authProvider.api);
    _router = AppRouter.create(_authProvider);
    _authProvider.addListener(_onAuthChanged);
  }

  void _onAuthChanged() {
    if (_authProvider.isAuthenticated && !_authProvider.isLoading) {
      unawaited(_workspaceProvider.prefetchAll());
    } else if (!_authProvider.isAuthenticated && !_authProvider.isLoading) {
      _workspaceProvider.clear();
    }
  }

  @override
  void dispose() {
    _authProvider.removeListener(_onAuthChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider.value(value: _themeProvider),
        ChangeNotifierProvider.value(value: _workspaceProvider),
      ],
      child: Selector<ThemeProvider, ThemeMode>(
        selector: (_, theme) => theme.mode,
        builder: (context, mode, _) {
          return MaterialApp.router(
            title: 'Collaborate',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: mode,
            routerConfig: _router,
          );
        },
      ),
    );
  }
}
