import 'package:flutter_test/flutter_test.dart';
import 'package:collaborate_mobile/main.dart';

void main() {
  testWidgets('Collaborate app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const CollaborateApp());
    expect(find.text('Collaborate'), findsWidgets);
  });
}
