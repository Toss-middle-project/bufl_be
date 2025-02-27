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
  const [category_name, target_amount, start_date, color] = req.body;

  try {
  } catch (err) {}
});
