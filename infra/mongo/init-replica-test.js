try {
  rs.status();
  print('Replica set already initialized');
} catch (_error) {
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: '127.0.0.1:27017' }],
  });
  print('Replica set initialized (test)');
}
