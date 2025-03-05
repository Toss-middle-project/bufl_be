const { Anthropic } = require("@anthropic-ai/sdk");

// API 키 설정 (환경 변수에서 가져오는 것을 권장)
const apiKey = process.env.ANTHROPIC_API_KEY || "앤쓰로픽 API KEY";

const anthropic = new Anthropic({
  apiKey: apiKey,
});

async function messageWithSystemPrompt() {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 0.7,
      system:
        "당신은 기술 문서 작성을 전문으로 하는 도우미입니다. 항상 명확하고 간결하게 응답하세요.",
      messages: [
        {
          role: "user",
          content: `2024년도 한국 주식시장에 대한 분석 요청.
          
          응답에 다음 구조를 사용하세요. JSON 형식으로만 응답하시오. 줄바꿈 문자을 넣지 말고, 줄바꿈하지 마시오.
          {"market_analysis": {"overview": "2024년 초반 시장은 AI 기술 발전과 연준의 금리 인하 기대감으로 상승세를 보이고 있습니다. 특히 반도체와 AI 관련주들의 강세가 두드러집니다.",
    "leading_themes": [
      {
        "name": "반도체",
        "news": "AI 칩 수요 증가와 생성형 AI 서비스 확대로 관련 기업들의 실적 개선 전망",
        "stocks": [
          ["stock name", "stock ticker", "rate", "volume"],
          ["stock name", "stock ticker", "rate", "volume"],
          ["stock name", "stock ticker", "rate", "volume"],
          ["stock name", "stock ticker", "rate", "volume"]
        ]
      }
    ]
  }
}
          `,
        },
      ],
    });

    console.log("시스템 프롬프트 사용 응답:");
    console.log(response.content);
  } catch (error) {
    console.error("에러 발생:", error);
  }
}

async function main() {
  console.log("\n=== 시스템 프롬프트 사용 ===");
  await messageWithSystemPrompt();
}

// 프로그램 실행
main().catch(console.error);
