const mysql = require("mysql2");

// 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: "bufl-database.crg60wagibq8.ap-northeast-2.rds.amazonaws.com",
  user: "admin",
  password: "bufl1234",
  database: "bufl",
});

// 연결
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database!");
});

// 연결 종료
module.exports = connection;
