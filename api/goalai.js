// 1. 기본 설정 및 모듈 불러오기
const { Anthropic } = require("@anthropic-ai/sdk");
require("dotenv").config(); // .env 파일을 불러오기

// API 키 설정 (환경 변수에서 가져오는 것을 권장)
const apiKey = process.env.ANTHROPIC_API_KEY;

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: apiKey,
});

// 2. 기본 메시지 생성 함수
async function generateMessage() {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // 최신 모델 사용 (2025년 2월 기준)
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
    console.error("에러 스택:", error.stack); // 스택 트레이스를 출력하여 에러 발생 위치를 추적
  }
}

// 7. 실행 예시
async function main() {
  console.log("=== 기본 메시지 생성 ===");
  await generateMessage(); // 재시도 로직을 포함한 메시지 생성
}

// 프로그램 실행
main().catch(console.error);
