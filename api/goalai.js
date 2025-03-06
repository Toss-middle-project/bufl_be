const { Anthropic } = require("@anthropic-ai/sdk");
require("dotenv").config("../.env");
const express = require("express");
const db = require("../db/db");

const router = express.Router();

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey });
// AI에게 목표 추천 요청
// AI로부터 추천 받은 목표를 세션에 저장하는 함수
async function getGoalRecommendations(req) {
  try {
    // 세션에서 이미 데이터가 있는지 확인
    const cachedData = req.session.goalRecommendations;

    if (cachedData) {
      console.log("세션에서 데이터 반환:", cachedData);
      return cachedData;
    }

    // 세션에 데이터가 없으면 AI로부터 데이터를 받아옴
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

    const parsedResponse = JSON.parse(response.content[0].text);
    console.log("AI 응답 내용:", parsedResponse);

    // 세션에 데이터 저장
    req.session.goalRecommendations = parsedResponse;

    return parsedResponse;
  } catch (error) {
    console.error("AI 목표 추천 오류:", error.message);
    throw new Error("AI 목표 추천 실패: " + error.message);
  }
}
// AI 추천 목표 목록 가져오기 (GET)
router.get("/", async (req, res) => {
  const userId = req.session.user_id;
  // const userId = 1;
  if (!userId) {
    return res.status(400).json({ message: "로그인이 필요합니다." });
  }
  try {
    // AI로부터 목표 추천을 받아옵니다.
    const aiResponse = await getGoalRecommendations(req);

    if (!aiResponse || aiResponse.length === 0) {
      return res
        .status(400)
        .json({ message: "AI에서 추천한 목표가 없습니다." });
    }

    // AI 추천 목표 목록을 응답으로 반환
    res.status(200).json({
      message: "AI 추천 목표 목록을 성공적으로 가져왔습니다.",
      recommendations: aiResponse, // AI 추천 목표 목록
    });
  } catch (error) {
    console.error("AI 추천 목표 목록 가져오기 실패:", error);
    res
      .status(500)
      .json({ message: "목표 추천 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

router.post("/generate-goals", async (req, res) => {
  const userId = req.session.user_id;
  const accountId = req.session.account_id;
  // const userId = 1;
  if (!userId) {
    return res.status(400).json({ message: "로그인이 필요합니다." });
  }
  const aiResponse = await getGoalRecommendations(req);
  const selectedGoalIndex = req.body.selectedGoalIndex;

  // aiResponse에서 savings_goals 배열을 사용하도록 변경
  const goals = aiResponse.savings_goals;

  console.log("selectedGoalIndex:", selectedGoalIndex); // 디버깅: 인덱스 값 확인
  console.log("Goals Length:", goals.length); // 디버깅: AI 추천 목표 목록 길이 확인

  if (!goals || goals.length === 0) {
    return res.status(400).json({ message: "AI에서 추천한 목표가 없습니다." });
  }

  // 인덱스가 배열 범위 내에 있는지 확인
  if (selectedGoalIndex < 0 || selectedGoalIndex >= goals.length) {
    return res
      .status(400)
      .json({ message: "선택된 목표가 유효하지 않습니다." });
  }

  try {
    const selectedGoal = goals[selectedGoalIndex];

    if (!selectedGoal) {
      return res
        .status(400)
        .json({ message: "선택된 목표가 유효하지 않습니다." });
    }

    // 목표 금액 자동 설정 (예: 목표 금액을 300만원으로 설정)
    const { goal_name, goal_amount, goal_duration, monthly_saving } =
      selectedGoal;

    // 목표 금액 및 월별 저축액 업데이트
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

    res.status(200).json({
      message: "선택된 목표가 성공적으로 저장되었습니다.",
      goal: selectedGoal,
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
