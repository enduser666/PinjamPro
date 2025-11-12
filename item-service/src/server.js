const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./db');
const itemServiceLogic = require('./services/itemService');

// Load .env
dotenv.config();

// Load DB
connectDB();

// Definisikan path ke proto file
const PROTO_PATH = path.join(__dirname, 'proto/item.proto');

// Konfigurasi Proto Loader
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load package
const itemProto = grpc.loadPackageDefinition(packageDefinition).item;

// Fungsi utama
const main = async () => {
  // Sinkronisasi database
  await sequelize.sync({ alter: true }); // 'alter: true' aman untuk dev
  console.log('Database synchronized (Item Service)');

  const server = new grpc.Server();

  // Tambahkan service ke server
  server.addService(itemProto.ItemService.service, itemServiceLogic);

  const port = process.env.PORT || 50052;
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Failed to bind server:', err);
        return;
      }
      console.log(`Item Service gRPC server running on port ${port}`);
      server.start();
    }
  );
};

main();