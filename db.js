// db.js
const mysql = require("mysql2");

// 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: "localhost", // 데이터베이스 호스트
  user: "root", // MySQL 사용자 이름
  password: "1234", // MySQL 비밀번호
  database: "bufl", // 사용할 데이터베이스 이름
});

// 데이터베이스 연결
connection.connect((err) => {
  if (err) {
    console.error("데이터베이스 연결 오류:", err.stack);
    return;
  }
  console.log("데이터베이스에 연결됨");
});
// Users 테이블에 데이터 삽입
const insertUser = (userName, userRegnu, userPhone) => {
  const query =
    "INSERT INTO Users (user_name, user_regnu, user_phone) VALUES (?, ?, ?)";
  connection.query(
    query,
    [userName, userRegnu, userPhone],
    (error, results) => {
      if (error) {
        console.error("데이터 삽입 오류:", error);
      } else {
        console.log("회원 데이터 삽입 성공:", results.insertId);
      }
    }
  );
};

// 연결 종료
connection.end();
