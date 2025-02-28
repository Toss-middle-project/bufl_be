const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

router.get("/", async (req, res) => {
  try {
    res.json({ message: "월급쪼개기 설정 화면입니다" });
  } catch (err) {
    console.error("월급쪼개기 설정 화면 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.post("/", (req, res) => {});

router.post("/category", async (req, res) => {
  const { name, goal_amount, start_date, background_color } = req.body;

  try {
    if (!name || !start_date || !background_color) {
      return res.status(400).json({ message: "모든 정보를 입력하세요" });
    }
    const [result] = await db.query(
      "INSERT INTO Categories (name, goal_amount, start_date, background_color) VALUES (?, ?, ?, ?)",
      [name, goal_amount, start_date, background_color]
    );

    res.status(201).json({ message: "카테고리 추가 성공" });
  } catch (err) {
    console.error("카테고리 추가 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
