const mysql = require("mysql");

// 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// 연결
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database!");
});

// 연결 종료
connection.end();
