const express = require("express");
const db = require("../db/db");
const router = express.Router();

router.post("/", (req, res) => {
  const { user_name, user_regnu, user_phone, user_password } = req.body;

  if (!user_name || !user_regnu || !user_phone || !user_password) {
    return res.status(400).json({ message: "모든 정보를 입력하세요." });
  }

  if (user_password.length < 6) {
    return res
      .status(400)
      .json({ message: "비밀번호는 6자리 이상이어야 합니다." });
  }

  // 기존 회원 확인
  db.query(
    "SELECT * FROM Users WHERE user_regnu = ? OR user_phone = ?",
    [user_regnu, user_phone],
    (err, results) => {
      if (err) {
        console.error("중복 체크 오류:", err);
        return res.status(500).json({ message: "서버 오류" });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "이미 가입된 회원입니다." });
      }

      // 회원 정보 삽입
      db.query(
        "INSERT INTO Users (user_name, user_regnu, user_phone, user_password) VALUES (?, ?, ?, ?)",
        [user_name, user_regnu, user_phone, user_password],
        (err) => {
          if (err) {
            console.error("회원가입 오류:", err);
            return res.status(500).json({ message: "서버 오류" });
          }
          res.status(201).json({ message: "회원가입 성공" });
        }
      );
    }
  );
});

module.exports = router;
