const mysql = require("mysql");

// 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: "192.168.1.65",
  user: "ninja",
  password: "1234",
  database: "bufl",
});

// 연결
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database!");
});

// 연결 종료
connection.end();
