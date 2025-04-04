const mysql = require("mysql2/promise");
require("dotenv").config("../.env");

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // 연결이 없을 때 대기하도록 설정
  connectionLimit: 10, // 최대 연결 수
  queueLimit: 0, // 대기 큐의 길이
});

// 연결 확인 (async 함수 내에서 사용)
async function checkConnection() {
  try {
    const [rows] = await connection.execute("SELECT 1");
    console.log("Connected to the database!");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

checkConnection();

// 연결 객체를 다른 파일에서 사용할 수 있도록 내보내기
module.exports = connection;
