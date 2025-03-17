const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { specs, swaggerUi } = require("./swagger/swagger-config"); // swagger 설정
const usersRouter = require("./routes/user-routes"); // 사용자 라우터
const accountRouter = require("./routes/account-routes"); // 계좌목록 라우터
const salaryRouter = require("./routes/category-routes"); //월급 쪼개기 라우터
const transactionsRouter = require("./routes/transfer-routes"); // 자동이체 라우터
const expensesRouter = require("./routes/expense-routes"); // 소비내역 라우터
const goalRouter = require("./routes/goal-routes"); // 목표 라우터
const aiAnalysisRouter = require("./routes/analysis-routes"); //ai 소비 분석 / 카테고리리 비율 추천 라유터
const goalAI = require("./routes/aigoal-routes"); // ai 목표 설정 라우터

const app = express();
const port = 5000;

app.use(
  cors({
    origin: "https://buflfe.vercel.app", // 프론트엔드 주소
    credentials: true, // 쿠키 허용
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "secret code", // 세션 암호화에 사용할 키
    resave: false, // 세션 변경 시마다 저장하는 설정
    saveUninitialized: true, // 세션 초기화 상태에서 저장할지 여부
    cookie: { secure: true },
  })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api/users", usersRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/salary", salaryRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/goals", goalRouter);
app.use("/api/ai-goals", goalAI);
app.use("/api/ai-analysis", aiAnalysisRouter);

app.get("/", async (req, res) => {
  try {
    if (req.cookies.sessionId) {
      // 회원가입 한 경우 로그인 화면으로 넘어감
      res.redirect("/api/users/login");
    } else {
      // 회원가입 하지 않은 경우 회원가입 화면으로 넘어감
      res.redirect("/api/users");
    }
  } catch (err) {
    console.error("메인 화면 처리 중 오류 발생:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

app.listen(port, () => {
  console.log("✅ 서버 실행 중: http://localhost:5000");
  console.log("📄 Swagger 문서: http://localhost:5000/api-docs");
});
