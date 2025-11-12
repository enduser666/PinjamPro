const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./db');
const userServiceLogic = require('./services/userService');

// Load .env
dotenv.config();

// Load DB
connectDB();

// Definisikan path ke proto file
const PROTO_PATH = path.join(__dirname, 'proto/user.proto');

// Konfigurasi Proto Loader
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load package
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Fungsi utama
const main = async () => {
  // Sinkronisasi database (buat tabel jika belum ada)
  await sequelize.sync();
  console.log('Database synchronized');

  const server = new grpc.Server();

  // Tambahkan service ke server
  server.addService(userProto.UserService.service, userServiceLogic);

  const port = process.env.PORT || 50051;
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Failed to bind server:', err);
        return;
      }
      console.log(`User Service gRPC server running on port ${port}`);
      server.start();
    }
  );
};

main();