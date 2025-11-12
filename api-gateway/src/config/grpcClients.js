/*
 * File ini memuat SEMUA file .proto dan menginisialisasi
 * gRPC client untuk setiap microservice.
 * Pastikan Anda sudah menyalin file .proto ke 'proto/'
 */
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Path ke direktori proto
const PROTO_DIR = path.join(__dirname, '../proto');

// Helper function untuk memuat proto
const loadProto = (filename) => {
  const protoPath = path.join(PROTO_DIR, filename);
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(packageDefinition);
};

// Load semua package proto
const userProto = loadProto('user.proto');
const itemProto = loadProto('item.proto');
const borrowingProto = loadProto('borrowing.proto');
// const notificationProto = loadProto('notification.proto');

// Inisialisasi gRPC Clients
const userClient = new userProto.user.UserService(
  process.env.USER_SERVICE_URL || 'localhost:50051',
  grpc.credentials.createInsecure()
);

const itemClient = new itemProto.item.ItemService(
  process.env.ITEM_SERVICE_URL || 'localhost:50052',
  grpc.credentials.createInsecure()
);

const borrowingClient = new borrowingProto.borrowing.BorrowingService(
  process.env.BORROWING_SERVICE_URL || 'localhost:50053',
  grpc.credentials.createInsecure()
);

// const notificationClient = new notificationProto.notification.NotificationService(
//   process.env.NOTIFICATION_SERVICE_URL || 'localhost:50054',
//   grpc.credentials.createInsecure()
// );

module.exports = {
  userClient,
  itemClient,
  borrowingClient,
  // notificationClient,
};