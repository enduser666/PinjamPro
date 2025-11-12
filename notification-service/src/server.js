/*
 * Ini adalah kerangka sederhana untuk notification-service.
 * Service ini tidak memerlukan database.
 * Logika aslinya akan mengirim email (Nodemailer), 
 * push notification (FCM), atau WebSocket.
 * Untuk saat ini, kita hanya akan melakukan console.log
 */
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Definisikan path ke proto file
const PROTO_PATH = path.join(__dirname, 'proto/notification.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const notificationProto = grpc.loadPackageDefinition(packageDefinition).notification;

// Implementasi logika service
const notificationServiceLogic = {
  SendNotification: (call, callback) => {
    const { user_id, message, type } = call.request;
    
    console.log('=================================');
    console.log('📫 NOTIFIKASI BARU');
    console.log(`   Tipe    : ${type}`);
    console.log(`   User ID : ${user_id}`);
    console.log(`   Pesan   : ${message}`);
    console.log('=================================');
    
    // Di sini Anda akan menambahkan logika Nodemailer/Socket.io/FCM
    
    callback(null, { success: true, message: "Notification logged" });
  }
};

// Fungsi utama
const main = () => {
  const server = new grpc.Server();
  server.addService(notificationProto.NotificationService.service, notificationServiceLogic);

  const port = process.env.PORT || 50054;
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Failed to bind server:', err);
        return;
      }
      console.log(`Notification Service gRPC server running on port ${port}`);
      server.start();
    }
  );
};

main();