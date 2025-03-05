const express = require("express");
const db = require("../db/db");
const router = express.Router();

// 목표 달성 확률 계산 함수
function calculateGoalCompletionProbability(
  goal_amount,
  current_amount,
  goal_duration,
  elapsed_months
) {
  const remainingAmount = goal_amount - current_amount;
  const monthsRemaining = goal_duration - elapsed_months;
  if (monthsRemaining <= 0) return 100;
  const probability = (current_amount / goal_amount) * 100;

  // 소수점 두 자리로 제한
  return probability > 100 ? 100 : probability.toFixed(2);
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
 * tags:
 *   name: Goals
 *   description: 저축 목표 관련 API
 */

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: "목표 설정"
 *     description: "사용자가 새로운 저축 목표를 설정합니다."
 *     tags: [Goals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal_name:
 *                 type: string
 *                 description: "저축 목표 이름"
 *               goal_amount:
 *                 type: number
 *                 format: float
 *                 description: "목표 금액"
 *               goal_duration:
 *                 type: integer
 *                 description: "목표 기간 (개월)"
 *               account_id:
 *                 type: integer
 *                 description: "사용자의 계좌 ID"
 *     responses:
 *       201:
 *         description: "목표가 설정되었습니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표가 설정되었습니다."
 *                 goal_id:
 *                   type: integer
 *                   description: "목표 ID"
 *                 probability:
 *                   type: integer
 *                   description: "목표 달성 확률"
 *                 account_number:
 *                   type: string
 *                   description: "사용자 계좌 번호"
 *       400:
 *         description: "필수 필드 누락"
 *       404:
 *         description: "계좌를 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */

// 목표 설정 API
router.post("/", async (req, res) => {
  const userId = 1;
  if (!userId) {
    return res.status(400).json({ message: "로그인을 해주세요." });
  }

  const { goal_name, goal_amount, goal_duration, account_id } = req.body;

  if (!account_id || !goal_name || !goal_amount || !goal_duration) {
    return res.status(400).json({ message: "모든 필드를 입력해주세요." });
  }

  try {
    // 계좌 정보 조회 (account_id에 해당하는 계좌 번호 및 잔액 포함)
    const [accountResult] = await db.query(
      `SELECT account_number FROM account WHERE account_id = ?`,
      [account_id]
    );

    if (accountResult.length === 0) {
      return res.status(404).json({ message: "계좌를 찾을 수 없습니다." });
    }

    const account = accountResult[0]; // 계좌 정보

    const [result] = await db.query(
      `INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MONTH), ?, ?)`,
      [goal_name, goal_amount, goal_duration, goal_duration, userId, account_id]
    );

    res.status(201).json({
      message: "목표가 설정되었습니다.",
      goal_id: result.insertId,
      probability: 0,
      account_number: account.account_number, // 계좌 번호는 응답으로만 전달
    });
  } catch (err) {
    console.error("목표 설정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: "저축 목표 목록 조회"
 *     description: "사용자의 저축 목표 목록과 목표 달성 확률을 조회합니다."
 *     tags: [Goals]
 *     responses:
 *       200:
 *         description: "목표 내역 조회 성공"
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
 *                       goal_name:
 *                         type: string
 *                       goal_amount:
 *                         type: number
 *                         format: float
 *                       current_amount:
 *                         type: number
 *                         format: float
 *                       goal_duration:
 *                         type: integer
 *                       goal_start:
 *                         type: string
 *                         format: date-time
 *                       goal_end:
 *                         type: string
 *                         format: date-time
 *                       probability:
 *                         type: integer
 *       400:
 *         description: "로그인이 필요합니다."
 *       404:
 *         description: "목표 내역이 없음"
 *       500:
 *         description: "서버 오류"
 */

// 목표 조회 API
router.get("/", async (req, res) => {
  const userId = 3;

  if (!userId) {
    return res.status(400).json({ message: "로그인이 필요합니다." });
  }

  try {
    const [results] = await db.query(`SELECT * FROM goal WHERE user_id = ?`, [
      userId,
    ]);

    if (results.length === 0) {
      return res.status(404).json({ message: "목표 내역이 없습니다." });
    }

    const goalsWithProbability = results.map((goal) => {
      const elapsedMonths = getElapsedMonths(goal.goal_start);
      const probability = calculateGoalCompletionProbability(
        goal.goal_amount,
        goal.current_amount || 0,
        goal.goal_duration,
        elapsedMonths
      );
      return { ...goal, probability };
    });

    res.status(200).json({ message: "목표 내역", goals: goalsWithProbability });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /goals/{goal_id}/deposit:
 *   post:
 *     summary: "목표 입금"
 *     description: "사용자가 설정한 저축 목표에 입금을 합니다."
 *     tags: [Goals]
 *     parameters:
 *       - in: path
 *         name: goal_id
 *         required: true
 *         description: "목표 ID"
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deposit_amount:
 *                 type: number
 *                 format: float
 *                 description: "입금 금액"
 *               account_id:
 *                 type: integer
 *                 description: "입금할 계좌 ID"
 *     responses:
 *       200:
 *         description: "입금 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "입금 성공"
 *                 newAmount:
 *                   type: number
 *                   format: float
 *                   description: "입금 후 목표 금액"
 *                 goal:
 *                   type: object
 *                   properties:
 *                     goal_name:
 *                       type: string
 *                     current_amount:
 *                       type: number
 *                       format: float
 *                     goal_amount:
 *                       type: number
 *                       format: float
 *       400:
 *         description: "올바른 입금 금액을 입력해주세요."
 *       404:
 *         description: "목표 또는 계좌를 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */
// 목표 입금 API
router.post("/:goal_id/deposit", async (req, res) => {
  const { goal_id } = req.params;
  const { deposit_amount, account_id } = req.body;

  if (!deposit_amount || isNaN(deposit_amount) || deposit_amount <= 0) {
    return res
      .status(400)
      .json({ message: "올바른 입금 금액을 입력해주세요." });
  }

  try {
    // 목표 정보 조회
    const [goalResult] = await db.query(
      `SELECT goal_amount, account_id, current_amount, goal_name FROM goal WHERE goal_id = ?`,
      [goal_id]
    );

    if (goalResult.length === 0) {
      return res.status(404).json({ message: "목표를 찾을 수 없습니다." });
    }

    const goal = goalResult[0];
    const newAmount =
      parseFloat(goal.current_amount || 0) + parseFloat(deposit_amount);

    if (newAmount > goal.goal_amount) {
      return res
        .status(400)
        .json({ message: "목표 금액을 초과하는 입금은 할 수 없습니다." });
    }

    // 계좌 정보 조회 (계좌 번호를 가져오기 위해 account 테이블 조회)
    const [accountResult] = await db.query(
      `SELECT account_number, balance FROM account WHERE account_id = ?`,
      [account_id]
    );

    if (accountResult.length === 0) {
      return res.status(404).json({ message: "계좌를 찾을 수 없습니다." });
    }

    const account = accountResult[0]; // 계좌 정보
    const accountBalance = account.balance;
    const account_number = account.account_number; // 계좌 번호

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
      VALUES (?, ?, ?, 'IN', ?, ?, '목표저축')`,
      [
        goal.account_id, // 목표 계좌 ID (to_account_number)
        account_number, // 사용자의 계좌 번호 (from_account_number)
        goal.goal_name, // 목표 계좌 번호 (to_account_number)
        deposit_amount, // 입금 금액
        newBalance, // 입금 후 잔액
      ]
    );

    // 목표 금액 업데이트
    await db.query(`UPDATE goal SET current_amount = ? WHERE goal_id = ?`, [
      newAmount,
      goal_id,
    ]);

    res.status(200).json({
      message: "입금 성공",
      newAmount,
      goal: {
        goal_name: goal.goal_name,
        current_amount: newAmount,
        goal_amount: goal.goal_amount,
      },
    });
  } catch (err) {
    console.error("입금 처리 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
