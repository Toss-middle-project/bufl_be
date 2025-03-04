express = require("express");
const db = require("../db/db");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: 저축 목표 관련 API
 */

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
// 목표 생성하기
router.post("/", async (req, res) => {
  const userId = req.session.user_id;
  // const userId = 1;
  if (!userId) {
    return res.status(400).json({ message: "로그인이 필요합니다." });
  }
  const { goal_name, goal_amount, goal_duration, account_id } = req.body; // account_id도 body에서 받아옵니다.

  if (!goal_name || !goal_amount || !goal_duration || !account_id) {
    return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
  }

  // goal_start는 현재 날짜
  const goal_start = new Date();

  // goal_end는 goal_start에서 goal_duration 개월 후 계산
  const goal_end = new Date();
  goal_end.setMonth(goal_end.getMonth() + goal_duration); // 목표 종료일 계산

  try {
    const [result] = await db.execute(
      `INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`, // user_id와 account_id를 추가
      [
        goal_name,
        goal_amount,
        goal_duration,
        goal_start,
        goal_end,
        userId,
        account_id,
      ]
    );
    res
      .status(201)
      .json({ message: "목표 생성 성공", goalId: result.insertId });
  } catch (err) {
    console.error(err);
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
 *       404:
 *         description: 목표 내역이 없습니다.
 *       500:
 *         description: 서버 오류
 */
// 특정 사용자 목표 내역
router.get("/", async (req, res) => {
  const userId = req.session.user_id;
  // const userId = 1;
  if (!userId) {
    return res.status(400).json({ message: "로그인이 필요합니다." });
  }
  try {
    // 해당 user_id로 생성한 목표 내역만 가져오기
    const [results] = await db.query(`SELECT * FROM goal WHERE user_id = ?`, [
      userId,
    ]);

    if (results.length === 0) {
      res.status(404).json({ message: "목표 내역이 없습니다." });
    } else {
      res.status(200).json({ message: "목표 내역", goals: results });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/goals/{goal_id}:
 *   get:
 *     summary: 특정 목표 상세 조회
 *     tags: [Goals]
 *     description: 특정 목표의 상세 정보를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: goal_id
 *         required: true
 *         description: 조회할 목표 ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 목표 상세 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "1의 1목표 정보 조회 성공"
 *                 goal:
 *                   type: object
 *                   properties:
 *                     goal_id:
 *                       type: integer
 *                       example: 1
 *                     goal_name:
 *                       type: string
 *                       example: "해외여행"
 *                     goal_amount:
 *                       type: number
 *                       example: 1000000
 *       404:
 *         description: 목표를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류
 */

// 목표 상세내역
router.get("/:goal_id", async (req, res) => {
  const { goal_id } = req.params;
  const userId = req.session.user_id;
  // const userId = 1;
  if (!userId) {
    return res.status(400).json({ message: "로그인이 필요합니다." });
  }
  try {
    // 사용자 및 목표에 대한 정보 조회
    const [goalResult] = await db.query(
      `SELECT * FROM goal WHERE goal_id = ? AND user_id = ?`,
      [goal_id, userId]
    );

    if (goalResult.length === 0) {
      return res.status(404).json({ message: "목표를 찾을 수 없습니다." });
    }
    res.status(200).json({
      message: `${userId}의 ${goal_id}목표 정보 조회 성공`,
      goal: goalResult[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});
/**
 * @swagger
 * /api/goals/{goal_id}/detail:
 *   get:
 *     summary: 특정 목표의 저축 진행률 및 입금 내역 조회
 *     tags: [Goals]
 *     description: 특정 목표의 저축 진행 상태 및 입금 내역을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: goal_id
 *         required: true
 *         description: 조회할 목표 ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 목표 상세 내역 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 상세 내역 조회 성공"
 *                 goal:
 *                   type: object
 *                   properties:
 *                     goal_id:
 *                       type: integer
 *                       example: 1
 *                     goal_name:
 *                       type: string
 *                       example: "해외여행"
 *                 progress:
 *                   type: object
 *                   properties:
 *                     현재저축액:
 *                       type: string
 *                       example: "500000.00"
 *                     남은저축액:
 *                       type: string
 *                       example: "500000.00"
 *                     달성율:
 *                       type: string
 *                       example: "50%"
 *                 저축목록:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       deposit_date:
 *                         type: string
 *                         example: "2024-03-01"
 *                       deposit_amount:
 *                         type: string
 *                         example: "200000.00"
 *                       cumulative_amount:
 *                         type: string
 *                         example: "500000.00"
 *       404:
 *         description: 목표를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류
 */

// 목표 상세내역
router.get("/:goal_id/detail", async (req, res) => {
  const { goal_id } = req.params;
  const userId = req.session.user_id;
  // const userId = 1;
  if (!userId) {
    return res.status(400).json({ message: "로그인이 필요합니다." });
  }
  try {
    // 사용자 및 목표에 대한 정보 조회
    const [goalResult] = await db.query(
      `SELECT * FROM goal WHERE goal_id = ? AND user_id = ?`,
      [goal_id, userId]
    );

    if (goalResult.length === 0) {
      return res.status(404).json({ message: "목표를 찾을 수 없습니다." });
    }

    const goal = goalResult[0];
    const goalAmount = parseFloat(goal.goal_amount); // goal_amount를 숫자로 변환

    // 입금 내역 조회
    const [depositResult] = await db.query(
      `SELECT deposit_date, deposit_amount, 
              (SELECT SUM(deposit_amount) FROM goal_detail WHERE goal_id = ? AND deposit_date <= gd.deposit_date) AS cumulative_amount
       FROM goal_detail gd WHERE goal_id = ?`,
      [goal_id, goal_id]
    );

    // 입금 내역의 총합 계산 (deposit_amount를 숫자로 변환)
    const currentAmount = depositResult.reduce((acc, deposit) => {
      return acc + (parseFloat(deposit.deposit_amount) || 0);
    }, 0);

    // 남은 금액 계산
    const remainingAmount = Math.max(0, goalAmount - currentAmount);

    // 목표 달성률 계산
    const completionRate =
      goalAmount > 0 ? Math.round((currentAmount / goalAmount) * 100) : 0;

    // 응답 데이터
    res.status(200).json({
      message: "목표 상세 내역 조회 성공",
      goal: goal,
      progress: {
        현재저축액: currentAmount.toFixed(2), // 소수점 2자리 처리
        남은저축액: remainingAmount.toFixed(2), // 소수점 2자리 처리
        달성율: `${completionRate}%`, // 소수점 2자리 처리
      },
      저축목록: depositResult.map((deposit) => ({
        deposit_date: deposit.deposit_date,
        deposit_amount: parseFloat(deposit.deposit_amount).toFixed(2), // 소수점 2자리 처리
        cumulative_amount: parseFloat(deposit.cumulative_amount).toFixed(2), // 소수점 2자리 처리
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
