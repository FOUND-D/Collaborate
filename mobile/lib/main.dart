import 'package:flutter/material.dart';

void main() {
  runApp(const CollaborateApp());
}

class CollaborateApp extends StatelessWidget {
  const CollaborateApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text("CollaborateApp"),
          backgroundColor: Colors.black,
          centerTitle: true,
          foregroundColor: Colors.white,
        ),
        body: Stack(
          child: List<Widget>(
        children: [
          Align(
            alignment: const AlignmentDirectional(0, 0),
            child: Container(
              width:
                  MediaQuery.of(context).size.width * 1, //You can fix your own
              height: MediaQuery.of(context).size.height * 1,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.blueAccent, width: 3),
              ),
        ),
      ),
        ],
          )
    )
      )
    );
  }
}
