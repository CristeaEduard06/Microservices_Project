const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'proto', 'client.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const clientProto = grpc.loadPackageDefinition(packageDefinition).client;

// Creează clientul gRPC
const client = new clientProto.ClientService(
  'microservice-client:50051', // numele containerului în rețeaua Docker
  grpc.credentials.createInsecure()
);

// Funcție care face request către gRPC server
function getClientInfo(name) {
  return new Promise((resolve, reject) => {
    client.GetClientInfo({ name }, (err, response) => {
      if (err) {
        return reject(err);
      }
      resolve(response);
    });
  });
}

module.exports = { getClientInfo };
