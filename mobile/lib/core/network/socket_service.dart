import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../config/app_config.dart';

class SocketService {
  io.Socket? _socket;

  io.Socket? connect({String? token}) {
    disconnect();
    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth(token != null ? {'token': token} : {})
          .build(),
    );
    _socket!.connect();
    return _socket;
  }

  void joinNotificationRoom(String userId) {
    _socket?.emit('joinNotificationRoom', userId);
  }

  void joinTeamRoom(String teamId) {
    _socket?.emit('joinTeamRoom', teamId);
  }

  void emitTyping(String conversationId) {
    _socket?.emit('typing', {'conversationId': conversationId});
  }

  void emitStopTyping(String conversationId) {
    _socket?.emit('stopTyping', {'conversationId': conversationId});
  }

  void onNewNotification(void Function(dynamic) handler) {
    _socket?.on('newNotification', handler);
  }

  void onNewMessage(void Function(dynamic) handler) {
    _socket?.on('newMessage', handler);
  }

  void off(String event) => _socket?.off(event);

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
