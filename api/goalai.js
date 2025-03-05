const { Anthropic } = require("@anthropic-ai/sdk");
require("dotenv").config();
const express = require("express");
const db = require("../db/db");

const router = express.Router();

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey });

// AI에게 목표 추천 요청
async function getGoalRecommendations() {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 0.7,
      system:
        "당신은 저축 목표를 추천하는 도우미입니다. 목표 금액과 기간을 고려해 월별 저축액을 5만원 단위로 계산해 추천합니다. 결과는 JSON 형식으로만 응답하고 줄바꿈하지 마세요.",
      messages: [
        {
          role: "user",
          content: `저축 목표를 추천해주세요. 목표 금액은 50만원에서 300만원 사이로 설정하고, 기간은 3개월에서 36개월 사이로 설정해주세요. 각 목표에 대해 5개 정도의 추천 목표를 생성해주세요. 각 목표의 goal_name, goal_amount, goal_duration, monthly_saving을 포함하는 JSON 형식으로 제공해주세요.`,
        },
      ],
    });

    return JSON.parse(response.content);
  } catch (error) {
    console.error("AI 목표 추천 오류:", error);
    throw new Error("AI 목표 추천 실패");
  }
}

// 목표를 DB에 저장하는 함수
async function saveGoalsToDB(goals, userId, accountId) {
  try {
    for (const goal of goals) {
      const { goal_name, goal_amount, goal_duration, monthly_saving } = goal;

      const [result] = await db.query(
        `INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id, monthly_saving)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MONTH), ?, ?, ?);`,
        [
          goal_name,
          goal_amount,
          goal_duration,
          goal_duration,
          userId,
          accountId,
          monthly_saving,
        ]
      );

      console.log(
        `목표 "${goal_name}"이 성공적으로 저장되었습니다. (ID: ${result.insertId})`
      );
    }
  } catch (error) {
    console.error("DB 저장 오류:", error);
    throw new Error("목표 저장 실패");
  }
}

// 목표 생성 및 저장 API 엔드포인트 추가
router.post("/generate-goals", async (req, res) => {
  const userId = req.userId; // 로그인한 사용자 ID
  const accountId = req.body.accountId; // 계좌 ID

  if (!userId || !accountId) {
    return res
      .status(400)
      .json({ message: "사용자 또는 계좌 정보가 누락되었습니다." });
  }

  try {
    const aiResponse = await getGoalRecommendations();

    if (!aiResponse.savings_goals || aiResponse.savings_goals.length === 0) {
      return res
        .status(400)
        .json({ message: "AI에서 추천한 목표가 없습니다." });
    }

    await saveGoalsToDB(aiResponse.savings_goals, userId, accountId);

    res.status(200).json({
      message: "AI 추천 목표가 성공적으로 저장되었습니다.",
      goals: aiResponse.savings_goals,
    });
  } catch (error) {
    console.error("AI 목표 추천 또는 DB 저장 실패:", error);
    res
      .status(500)
      .json({ message: "목표 추천 또는 저장 중 오류가 발생했습니다." });
  }
});

// 모듈 내보내기 (라우터 내보내기)
module.exports = router;
