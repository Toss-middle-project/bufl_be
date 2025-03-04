const express = require("express");
const db = require("../db/db");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: 저축 목표 관련 API
 */

// 목표 달성 확률 계산 함수
function calculateGoalCompletionProbability(
  goal_amount,
  current_amount,
  goal_duration,
  elapsed_months
) {
  const remainingAmount = goal_amount - current_amount;
  const monthsRemaining = goal_duration - elapsed_months;
  const averageMonthlyDeposit = remainingAmount / monthsRemaining;
  const probability = (current_amount / goal_amount) * 100;
  return probability > 100 ? 100 : probability;
}

// 경과된 월 수 계산
function getElapsedMonths(goal_start) {
  const startDate = new Date(goal_start);
  const currentDate = new Date();
  const monthDiff =
    currentDate.getMonth() -
    startDate.getMonth() +
    12 * (currentDate.getFullYear() - startDate.getFullYear());
  return monthDiff;
}

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: 새로운 저축 목표 생성
 *     tags: [Goals]
 *     description: 사용자가 새로운 저축 목표를 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal_name:
 *                 type: string
 *                 example: "해외여행"
 *               goal_amount:
 *                 type: number
 *                 example: 1000000
 *               goal_duration:
 *                 type: integer
 *                 example: 12
 *               account_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: 목표 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 생성 성공"
 *                 goalId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: 요청 데이터 오류
 *       500:
 *         description: 서버 오류
 */
router.post("/", async (req, res) => {
  const {
    goal_name,
    goal_amount,
    goal_duration,
    goal_end,
    user_id,
    account_id,
  } = req.body;

  if (
    !goal_name ||
    !goal_amount ||
    !goal_duration ||
    !goal_end ||
    !user_id ||
    !account_id
  ) {
    return res.status(400).json({ message: "모든 필드를 입력해주세요." });
  }

  const probability = calculateGoalCompletionProbability(
    goal_amount,
    0,
    goal_duration,
    0
  ); // 초기값은 0 (아직 입금되지 않은 상태)

  const query = `
    INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`;

  try {
    const [result] = await db.query(query, [
      goal_name,
      goal_amount,
      goal_duration,
      goal_end,
      user_id,
      account_id,
    ]);
    res.status(201).json({
      message: "목표가 설정되었습니다.",
      goal_id: result.insertId,
      probability,
    });
  } catch (err) {
    console.error("목표 설정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: 특정 사용자의 목표 목록 조회
 *     tags: [Goals]
 *     description: 사용자가 설정한 모든 저축 목표를 조회합니다.
 *     responses:
 *       200:
 *         description: 목표 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 내역"
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       goal_id:
 *                         type: integer
 *                         example: 1
 *                       goal_name:
 *                         type: string
 *                         example: "해외여행"
 *                       goal_amount:
 *                         type: number
 *                         example: 1000000
 *                       probability:
 *                         type: number
 *                         example: 50
 *       404:
 *         description: 목표 내역이 없습니다.
 *       500:
 *         description: 서버 오류
 */
router.get("/", async (req, res) => {
  const userId = 1; // 예시로 1번 사용자

  if (!userId) {
    return res.status(400).json({ message: "로그인이 필요합니다." });
  }

  try {
    const [results] = await db.query(`SELECT * FROM goal WHERE user_id = ?`, [
      userId,
    ]);

    if (results.length === 0) {
      res.status(404).json({ message: "목표 내역이 없습니다." });
    } else {
      const goalsWithProbability = results.map((goal) => {
        const elapsedMonths = getElapsedMonths(goal.goal_start);
        const probability = calculateGoalCompletionProbability(
          goal.goal_amount,
          goal.current_amount,
          goal.goal_duration,
          elapsedMonths
        );
        return { ...goal, probability };
      });

      res
        .status(200)
        .json({ message: "목표 내역", goals: goalsWithProbability });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.post("/:goal_id/deposit", async (req, res) => {
  const { goal_id } = req.params;
  const { deposit_amount, account_id } = req.body; // 사용자가 입금할 금액과 계좌 ID를 받음

  if (!deposit_amount || deposit_amount <= 0) {
    return res.status(400).json({ message: "입금할 금액을 입력해주세요." });
  }

  try {
    // 목표 정보 조회
    const [goalResult] = await db.query(
      `SELECT goal_amount, account_id, current_amount
      FROM goal WHERE goal_id = ?`,
      [goal_id]
    );

    if (goalResult.length === 0) {
      return res.status(404).json({ message: "목표를 찾을 수 없습니다." });
    }

    const goal = goalResult[0];
    const newAmount = goal.current_amount + deposit_amount;

    // 목표 금액을 초과하지 않도록 확인
    if (newAmount > goal.goal_amount) {
      return res
        .status(400)
        .json({ message: "목표 금액을 초과하는 입금은 할 수 없습니다." });
    }

    // 계좌 잔액 조회
    const [accountResult] = await db.query(
      `SELECT balance FROM account WHERE account_id = ?`,
      [account_id] // 사용자가 입력한 계좌 ID로 조회
    );

    const accountBalance = accountResult[0].balance;

    if (accountBalance < deposit_amount) {
      return res.status(400).json({ message: "계좌 잔액이 부족합니다." });
    }

    // 계좌에서 입금 처리
    const newBalance = accountBalance - deposit_amount;
    await db.query(`UPDATE account SET balance = ? WHERE account_id = ?`, [
      newBalance,
      account_id,
    ]);

    // 트랜잭션 기록
    await db.query(
      `INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc)
      VALUES (?, ?, ?, 'IN', ?, ?, '목표 저축 입금')`,
      [
        goal.account_id, // 목표 계좌 ID
        account_id, // 사용자의 계좌 번호
        goal.account_id, // 목표 계좌 번호
        deposit_amount,
        newBalance,
      ]
    );

    // 목표 금액 업데이트
    await db.query(`UPDATE goal SET current_amount = ? WHERE goal_id = ?`, [
      newAmount,
      goal_id,
    ]);

    res.status(200).json({ message: "입금 성공", newAmount });
  } catch (err) {
    console.error("입금 처리 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
