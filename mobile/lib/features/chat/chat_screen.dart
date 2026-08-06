import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/utils/json_helpers.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shared_widgets.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, this.chatId});
  final String? chatId;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<Map<String, dynamic>> _conversations = [];
  List<Map<String, dynamic>> _teams = [];
  List<Map<String, dynamic>> _messages = [];
  String? _selectedId;
  String _selectedType = 'conversation';
  String _selectedName = '';
  final _input = TextEditingController();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _selectedId = widget.chatId;
    _load();
  }

  Future<void> _load() async {
    final api = context.read<AuthProvider>().api;
    final convos = await api.getConversations();
    final teams = await api.getTeams();
    setState(() {
      _conversations = convos;
      _teams = teams;
      _loading = false;
    });
    if (_selectedId != null) await _loadMessages();
  }

  Future<void> _loadMessages() async {
    if (_selectedId == null) return;
    final api = context.read<AuthProvider>().api;
    final msgs = _selectedType == 'team'
        ? await api.getTeamMessages(_selectedId!)
        : await api.getConversationMessages(_selectedId!);
    setState(() => _messages = msgs);
  }

  void _openChat(String id, String type, String name) {
    setState(() {
      _selectedId = id;
      _selectedType = type;
      _selectedName = name;
    });
    _loadMessages();
  }

  Future<void> _send() async {
    if (_input.text.trim().isEmpty || _selectedId == null) return;
    final api = context.read<AuthProvider>().api;
    await api.sendMessage({
      if (_selectedType == 'team') 'teamId': _selectedId else 'recipientId': _selectedId,
      'content': _input.text.trim(),
    });
    _input.clear();
    await _loadMessages();
  }

  Widget _buildChatList() {
    return ListView(
      children: [
        const ListTile(title: Text('Teams', style: TextStyle(fontWeight: FontWeight.w700))),
        ..._teams.map((t) => ListTile(
              leading: const Icon(Icons.groups),
              title: Text(str(t['name'])),
              onTap: () => _openChat(pickId(t)!, 'team', str(t['name'])),
            )),
        const ListTile(title: Text('Direct messages', style: TextStyle(fontWeight: FontWeight.w700))),
        ..._conversations.map((c) => ListTile(
              leading: const Icon(Icons.person),
              title: Text(str(c['name'] ?? c['participant']?['name'])),
              onTap: () => _openChat(pickId(c)!, 'conversation', str(c['name'])),
            )),
      ],
    );
  }

  Widget _buildChatPanel() {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (_, i) {
              final m = _messages[i];
              final mine = pickId(m['sender']) == context.read<AuthProvider>().userId;
              return Align(
                alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: mine ? const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF0D9488)]) : null,
                    color: mine ? null : Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(14),
                    border: mine ? null : Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Text(str(m['content']), style: TextStyle(color: mine ? Colors.white : null)),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(child: TextField(controller: _input, decoration: const InputDecoration(hintText: 'Type a message...'))),
              IconButton(onPressed: _send, icon: const Icon(Icons.send)),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingView());

    final wide = MediaQuery.sizeOf(context).width > 700;

    if (!wide && _selectedId != null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(_selectedName),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => setState(() => _selectedId = null),
          ),
        ),
        body: _buildChatPanel(),
      );
    }

    if (!wide) {
      return Scaffold(body: _buildChatList());
    }

    return Row(
      children: [
        SizedBox(width: 300, child: _buildChatList()),
        const VerticalDivider(width: 1),
        Expanded(
          child: _selectedId == null
              ? const EmptyState(title: 'Select a conversation')
              : _buildChatPanel(),
        ),
      ],
    );
  }
}
