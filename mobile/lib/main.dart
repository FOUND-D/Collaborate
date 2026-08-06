import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'router/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();
    _themeProvider = ThemeProvider();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider.value(value: _themeProvider),
      ],
      child: Consumer2<AuthProvider, ThemeProvider>(
        builder: (context, auth, theme, _) {
          final router = AppRouter.create(auth);
          return MaterialApp.router(
            title: 'Collaborate',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: theme.mode,
            routerConfig: router,
          );
        },
      ),
    );
  }
}
