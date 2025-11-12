const grpc = require('@grpc/grpc-js');
const Borrowing = require('../models/borrowingModel');
const { Op } = require('sequelize');

/*
 * CATATAN PENTING:
 * Logika di service ini HANYA mengelola data 'Borrowing'.
 * Service ini TIDAK tahu menahu soal ketersediaan barang (item-service).
 *
 * Logika untuk:
 * 1. Mengecek ketersediaan barang SEBELUM membuat request
 * 2. Mengurangi `availableQuantity` SETELAH request di-approve
 * 3. Menambah `availableQuantity` SETELAH barang di-return
 * ...HARUS di-handle di level API Gateway (controller)
 * atau service orkestrasi yang lebih tinggi.
 */

// Implementasi Logika Service gRPC
const borrowingService = {
  /**
   * CreateBorrowRequest: Membuat request peminjaman (status 'pending')
   */
  CreateBorrowRequest: async (call, callback) => {
    const { user_id, item_id, quantity, start_date, end_date, notes } = call.request;

    try {
      if (!user_id || !item_id || !quantity || !start_date || !end_date) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Missing required fields',
        });
      }
      
      // TODO: Cek ketersediaan di item-service (dilakukan di API Gateway)
      // Di sini kita langsung buat request-nya.

      const newBorrowing = await Borrowing.create({
        userId: user_id,
        itemId: item_id,
        quantity: quantity,
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        notes: notes || '',
        status: 'pending',
      });

      callback(null, { borrow_request: newBorrowing.toJSON() });
    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  /**
   * Helper untuk update status (Approve, Reject, Return)
   */
  UpdateBorrowStatus: async (borrowing_id, new_status, admin_notes = '', callback) => {
    try {
      const borrowRequest = await Borrowing.findByPk(borrowing_id);
      if (!borrowRequest) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Borrowing request not found',
        });
      }

      borrowRequest.status = new_status;
      if (admin_notes) {
        borrowRequest.adminNotes = admin_notes;
      }
      
      // Jika status 'pending', tidak bisa di-return, dll. (tambah validasi)
      
      await borrowRequest.save();
      
      // TODO: API Gateway sekarang harus memanggil item-service
      // untuk update quantity berdasarkan 'new_status'
      
      callback(null, { borrow_request: borrowRequest.toJSON() });

    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  
  /**
   * ApproveBorrowing: Admin menyetujui request
   */
  ApproveBorrowing: (call, callback) => {
    const { borrowing_id, admin_notes } = call.request;
    borrowingService.UpdateBorrowStatus(borrowing_id, 'approved', admin_notes, callback);
  },

  /**
   * RejectBorrowing: Admin menolak request
   */
  RejectBorrowing: (call, callback) => {
    const { borrowing_id, admin_notes } = call.request;
    borrowingService.UpdateBorrowStatus(borrowing_id, 'rejected', admin_notes, callback);
  },

  /**
   * ReturnItem: User (atau Admin) menandai barang telah kembali
   */
  ReturnItem: (call, callback) => {
    const { borrowing_id, admin_notes } = call.request;
    // Cek tanggal pengembalian vs endDate untuk status 'late'
    // Untuk saat ini, kita set 'returned'
    borrowingService.UpdateBorrowStatus(borrowing_id, 'returned', admin_notes, callback);
  },

  /**
   * GetMyBorrowings: Mengambil semua request milik satu user
   */
  GetMyBorrowings: async (call, callback) => {
    try {
      const requests = await Borrowing.findAll({
        where: { userId: call.request.user_id },
        order: [['createdAt', 'DESC']],
      });
      callback(null, { borrow_requests: requests.map(r => r.toJSON()) });
    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  /**
   * GetAllBorrowings: Mengambil semua request (untuk Admin)
   */
  GetAllBorrowings: async (call, callback) => {
    const { status_filter } = call.request;
    try {
      let whereCondition = {};
      if (status_filter) {
        whereCondition.status = status_filter;
      }
      
      const requests = await Borrowing.findAll({
        where: whereCondition,
        order: [['createdAt', 'DESC']],
      });
      callback(null, { borrow_requests: requests.map(r => r.toJSON()) });
    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
  
  /**
   * GetHistory: Mengambil riwayat peminjaman
   */
  GetHistory: async (call, callback) => {
     const { user_id, start_date_filter, end_date_filter } = call.request;
     try {
       let whereCondition = {
           status: {
               [Op.in]: ['returned', 'rejected', 'late']
           }
       };
       
       if (user_id) {
           whereCondition.userId = user_id;
       }
       if (start_date_filter) {
           whereCondition.createdAt = {
               [Op.gte]: new Date(start_date_filter)
           };
       }
       // ... tambahkan logika filter tanggal yg lebih kompleks ...
       
       const requests = await Borrowing.findAll({
           where: whereCondition,
           order: [['updatedAt', 'DESC']]
       });
       callback(null, { borrow_requests: requests.map(r => r.toJSON()) });
     } catch (error) {
        console.error(error);
        callback({ code: grpc.status.INTERNAL, message: error.message });
     }
  },
  
};

module.exports = borrowingService;