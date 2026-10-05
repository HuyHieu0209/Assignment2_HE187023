// Import MongoClient từ thư viện mongodb
const { MongoClient } = require("mongodb");
// Địa chỉ MongoDB
// 27017 = port mặc định của MongoDB
const url = "mongodb://127.0.0.1:27017";
// Tạo đối tượng MongoClient
const client = new MongoClient(url);

// Hàm main() là nơi chạy chương trình
async function main() {
  try {
    // 1. Kết nối đến MongoDB
    await client.connect();
    console.log("Connected to MongoDB");
    console.log("================================");

    // 2. Chọn database và collection
    const db = client.db("school_db");
    const students = db.collection("students");

    console.log("Database:", db.databaseName);
    console.log("Collection: students");
    console.log("================================");

    // 1. CREATE (Thêm mới sinh viên)
    console.log("\n--- 1. CREATE (Thêm sinh viên mới) ---");
    const newStudent = {
      name: "Nguyễn Văn A",
      age: 20,
      major: "Công nghệ thông tin",
      class: "SE1801"
    };
    const insertResult = await students.insertOne(newStudent);
    console.log("Đã thêm sinh viên thành công, ID:", insertResult.insertedId);

    // 2. READ (Đọc/Lấy danh sách sinh viên)
    console.log("\n--- 2. READ (Lấy danh sách sinh viên) ---");
    const allStudents = await students.find({}).toArray();
    console.log("Tất cả sinh viên trong collection:");
    console.log(allStudents);
  } catch (error) {
    // Nếu kết nối hoặc thao tác bị lỗi thì hiển thị thông báo lỗi
    console.error("Lỗi thao tác MongoDB:", error);
  } finally {
    // 5. Đóng kết nối MongoDB
    await client.close();
    console.log("\nĐã đóng kết nối MongoDB.");
  }
}

// Gọi hàm main() để chạy chương trình
main();
