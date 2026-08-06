dynamic pickId(dynamic item) {
  if (item == null) return null;
  if (item is String) return item;
  if (item is Map) return item['_id'] ?? item['id'];
  return null;
}

String str(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  return value.toString();
}

List<Map<String, dynamic>> asMapList(dynamic data) {
  if (data is List) {
    return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
  return [];
}

Map<String, dynamic> asMap(dynamic data) {
  if (data is Map) return Map<String, dynamic>.from(data);
  return {};
}
