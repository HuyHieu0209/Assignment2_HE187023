const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);

let dbInstance = null;

const connectDB = async () => {
  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'student_manager';
    dbInstance = client.db(dbName);
    console.log(`Kết nối thành công tới MongoDB Database: "${dbName}"`);
    return dbInstance;
  } catch (error) {
    console.error(` Lỗi kết nối MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const getDB = () => {
  if (!dbInstance) {
    throw new Error('Chưa kết nối CSDL. Hãy gọi connectDB() trước.');
  }
  return dbInstance;
};

module.exports = { connectDB, getDB, client };
