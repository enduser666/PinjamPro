const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./db');
const borrowingServiceLogic = require('./services/borrowingService');

// Load .env
dotenv.config();

// Load DB
connectDB();

// Definisikan path ke proto file
const PROTO_PATH = path.join(__dirname, 'proto/borrowing.proto');

// Konfigurasi Proto Loader
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load package
const borrowingProto = grpc.loadPackageDefinition(packageDefinition).borrowing;

// Fungsi utama
const main = async () => {
  // Sinkronisasi database
  await sequelize.sync({ alter: true });
  console.log('Database synchronized (Borrowing Service)');

  const server = new grpc.Server();

  // Tambahkan service ke server
  server.addService(borrowingProto.BorrowingService.service, borrowingServiceLogic);

  const port = process.env.PORT || 50053;
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Failed to bind server:', err);
        return;
      }
      console.log(`Borrowing Service gRPC server running on port ${port}`);
      server.start();
    }
  );
};

main();