const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Încarcă fișierul .proto
const PROTO_PATH = path.join(__dirname, 'proto', 'client.proto'); // ✅ corect
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const clientProto = grpc.loadPackageDefinition(packageDefinition).client;

// Clienții fictivi
const clients = [
  { name: 'John Doe', company: 'OpenAI', position: 'CEO' },
  { name: 'Jane Smith', company: 'Google', position: 'CTO' },
];

// Implementare metodă gRPC
function GetClientInfo(call, callback) {
  const client = clients.find(c => c.name.toLowerCase() === call.request.name.toLowerCase());
  if (!client) {
    return callback({
      code: grpc.status.NOT_FOUND,
      message: 'Client not found',
    });
  }

  callback(null, client);
}

// Pornește serverul
function main() {
  const server = new grpc.Server();
  server.addService(clientProto.ClientService.service, { GetClientInfo });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    console.log('[gRPC] Server running on port 50051');
    server.start();
  });
}

main();
