express = require("express");
const db = require("../db/db");
const router = express.Router();

// 목표 생성하기
router.post("/", async (req, res) => {
  const { goal_name, goal_amount, goal_duration, userId } = req.body;

  if (!goal_name || !goal_amount || !goal_duration || !userId) {
    return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
  }
  // goal_start는 현재 날짜
  const goal_start = new Date();

  // goal_end는 goal_start에서 goal_duration 개월 후 계산
  const goal_end = new Date();
  goal_end.setMonth(goal_end.getMonth() + goal_duration); // 목표 종료일 계산

  try {
    const [result] = await db.execute(
      `INSERT INTO Goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, userId) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [goal_name, goal_amount, goal_duration, goal_start, goal_end, userId]
    );
    res.status(201).json({ message: "목표생성 성공", goalId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 전체 목표 내역
router.get("/", async (req, res) => {
  try {
    // 사용자가 생성한 모든 목표내역 가져오기
    const [results] = await db.query(`SELECT * FROM Goal`);
    if (results.length === 0) {
      res.status(404).json({ message: "목표 내역이 없습니다." });
    }
    res.status(200).json({ message: "목표 내역", goals: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 사용자별 목표내역
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    // 사용자가 생성한 모든 목표내역 가져오기
    const [results] = await db.query(`SELECT * FROM Goal WHERE userId=?`, [
      user_id,
    ]);
    if (results.length === 0) {
      res.status(404).json({ message: "목표 내역이 없습니다." });
    }
    res.status(200).json({ message: `${user_id}목표 내역`, goals: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
