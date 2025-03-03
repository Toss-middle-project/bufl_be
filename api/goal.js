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

// 목표 상세내역
router.get("/:user_id/:goal_id", async (req, res) => {
  const { user_id, goal_id } = req.params;

  try {
    // 사용자 및 목표에 대한 정보 조회
    const [goalResult] = await db.query(
      `SELECT * FROM Goal WHERE goal_id = ? AND userId = ?`,
      [goal_id, user_id]
    );

    if (goalResult.length === 0) {
      return res.status(404).json({ message: "목표를 찾을 수 없습니다." });
    }

    // 목표 정보 반환
    const goal = goalResult[0];

    res.status(200).json({
      message: "목표 정보 조회 성공",
      goal: {
        goal_id: goal.goal_id,
        goal_name: goal.goal_name,
        goal_amount: goal.goal_amount,
        goal_duration: goal.goal_duration,
        goal_start: goal.goal_start,
        goal_end: goal.goal_end,
        userId: goal.userId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 목표상세 입금내역
// 목표 상세 내역
router.get("/:user_id/:goal_id/detail", async (req, res) => {
  const { user_id, goal_id } = req.params;

  try {
    // 사용자 및 목표에 대한 정보 조회
    const [goalResult] = await db.query(
      `SELECT * FROM Goal WHERE goal_id = ? AND userId = ?`,
      [goal_id, user_id]
    );

    if (goalResult.length === 0) {
      return res.status(404).json({ message: "목표를 찾을 수 없습니다." });
    }

    const goal = goalResult[0];
    const goalAmount = goal.goal_amount;

    // 입금 내역 조회
    const [depositResult] = await db.query(
      `SELECT deposit_date, deposit_amount, 
              (SELECT SUM(deposit_amount) FROM goal_detail WHERE goal_id = ? AND deposit_date <= gd.deposit_date) AS cumulative_amount
       FROM goal_detail gd WHERE goal_id = ?`,
      [goal_id, goal_id]
    );

    // 입금 내역의 총합 계산 (deposit_amount를 숫자로 변환)
    const currentAmount = depositResult.reduce((acc, deposit) => {
      // deposit_amount를 숫자로 변환하여 누적 합계 계산
      return acc + (parseFloat(deposit.deposit_amount) || 0); // 값이 NaN일 경우 0으로 처리
    }, 0);

    // 남은 금액 계산
    const remainingAmount = Math.max(0, goalAmount - currentAmount); // 음수 방지

    // 목표 달성률 계산 (목표 금액을 0으로 나누지 않도록 처리)
    const completionRate =
      goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0;

    // 응답 데이터
    res.status(200).json({
      message: "목표 상세 내역 조회 성공",
      goal: goal,
      progress: {
        현재저축액: currentAmount, // 소수점 2자리까지 표시
        남은저축액: remainingAmount,
        달성율: completionRate, // 소수점 2자리까지 표시
      },
      저축목록: depositResult.map((deposit) => ({
        deposit_date: deposit.deposit_date,
        deposit_amount: parseFloat(deposit.deposit_amount), // deposit_amount를 숫자로 변환하고 소수점 2자리까지 표시
        cumulative_amount: parseFloat(deposit.cumulative_amount), // cumulative_amount도 숫자 처리
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
