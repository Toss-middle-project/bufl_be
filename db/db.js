const mysql = require("mysql");

// 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: "localhost",
  user: "ninja",
  password: "1234",
  database: "bufl",
});

// 연결
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database!");
});

// 쿼리 실행
connection.query("SELECT * FROM Users", (err, results) => {
  if (err) throw err;
  console.log(results);
});

// 연결 종료
connection.end();
