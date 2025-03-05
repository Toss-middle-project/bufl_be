// .env 파일을 불러오기
require("dotenv").config({ path: "../.env" }); // 반드시 가장 상단에 위치

// API 키 설정
const apiKey = process.env.ANTHROPIC_API_KEY;
const { Anthropic } = require("@anthropic-ai/sdk");

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: apiKey,
});

// 메시지 생성 함수
async function generateMessage() {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // 최신 모델 사용
      max_tokens: 1000,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: "저축 목표 한개만 추천",
        },
      ],
    });

    console.log("응답:");
    console.log(response.content);
  } catch (error) {
    console.error("에러 발생:", error.message);
    console.error("에러 스택:", error.stack);
  }
}

// 실행 예시
async function main() {
  console.log("=== 기본 메시지 생성 ===");
  await generateMessage(); // 메시지 생성
}

main().catch(console.error);
