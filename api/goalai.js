const { Anthropic } = require("@anthropic-ai/sdk");
require("dotenv").config("../.env");
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

    // 응답 내용 확인
    console.log("AI 응답 내용:", response);

    // JSON 파싱 (응답 내용이 JSON 형식이라면 바로 파싱)
    const parsedResponse = JSON.parse(response.content[0].text); // 응답이 JSON 문자열이라고 가정
    console.log("파싱된 응답:", parsedResponse);

    return parsedResponse;
  } catch (error) {
    console.error("AI 목표 추천 오류:", error.message);
    throw new Error("AI 목표 추천 실패: " + error.message);
  }
}
// AI 추천 목표 목록 가져오기 (GET)
router.get("/generate-goals", async (req, res) => {
  try {
    // AI로부터 목표 추천을 받아옵니다.
    const aiResponse = await getGoalRecommendations();

    if (
      !aiResponse.recommendations ||
      aiResponse.recommendations.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "AI에서 추천한 목표가 없습니다." });
    }

    // AI 추천 목표 목록을 응답으로 반환
    res.status(200).json({
      message: "AI 추천 목표 목록을 성공적으로 가져왔습니다.",
      recommendations: aiResponse.recommendations, // AI 추천 목표 목록
    });
  } catch (error) {
    console.error("AI 추천 목표 목록 가져오기 실패:", error);
    res
      .status(500)
      .json({ message: "목표 추천 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

// 모듈 내보내기 (라우터 내보내기)
module.exports = router;
