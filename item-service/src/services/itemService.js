const grpc = require('@grpc/grpc-js');
const Item = require('../models/itemModel');
const { Op } = require('sequelize');

// Implementasi Logika Service gRPC
const itemService = {
  /**
   * CreateItem: Membuat barang baru
   */
  CreateItem: async (call, callback) => {
    const { name, description, category, total_quantity, image_url } = call.request;

    try {
      if (!name || total_quantity == null || total_quantity < 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Name and total_quantity are required',
        });
      }

      const item = await Item.create({
        name,
        description: description || '',
        category: category || '',
        totalQuantity: total_quantity,
        imageUrl: image_url || '',
      });

      callback(null, { item: item.toJSON() });
    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  /**
   * GetItem: Mengambil detail satu barang
   */
  GetItem: async (call, callback) => {
    try {
      const item = await Item.findByPk(call.request.id);
      if (!item) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Item not found',
        });
      }
      callback(null, { item: item.toJSON() });
    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  /**
   * UpdateItem: Memperbarui data barang
   */
  UpdateItem: async (call, callback) => {
    const { id, name, description, category, total_quantity, available_quantity, image_url } = call.request;
    try {
      const item = await Item.findByPk(id);
      if (!item) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Item not found',
        });
      }

      // Update field jika ada di request
      if (name) item.name = name;
      if (description) item.description = description;
      if (category) item.category = category;
      if (total_quantity != null) item.totalQuantity = total_quantity;
      if (available_quantity != null) item.availableQuantity = available_quantity;
      if (image_url) item.imageUrl = image_url;

      await item.save(); // Hook beforeUpdate akan berjalan di sini

      callback(null, { item: item.toJSON() });
    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  /**
   * DeleteItem: Menghapus barang
   */
  DeleteItem: async (call, callback) => {
    try {
      const item = await Item.findByPk(call.request.id);
      if (!item) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Item not found',
        });
      }

      await item.destroy();
      callback(null, {}); // Sukses, response kosong
    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  /**
   * ListItems: Mengambil daftar semua barang
   */
  ListItems: async (call, callback) => {
    const { category_filter } = call.request;
    try {
      let whereCondition = {};
      if (category_filter) {
        whereCondition.category = {
          [Op.like]: `%${category_filter}%`,
        };
      }

      const items = await Item.findAll({
        where: whereCondition,
        order: [['name', 'ASC']],
      });

      callback(null, { items: items.map((item) => item.toJSON()) });
    } catch (error) {
      console.error(error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },
};

module.exports = itemService;