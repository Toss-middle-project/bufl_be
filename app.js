const express = require("express");
const cors = require("cors");
const db = require("./db/db"); // DB 설정 파일
const usersRouter = require("./api/users"); // 사용자 라우터 가져오기
const accountRouter = require("./api/account"); // 계좌목록 가져오기
const salaryRouter = require("./api/salary");
const session = require("express-session");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: "secret code", // 세션 암호화에 사용할 키
    resave: false, // 세션 변경 시마다 저장하는 설정
    saveUninitialized: true, // 세션 초기화 상태에서 저장할지 여부
    cookie: { secure: false }, // https를 사용할 경우 true로 설정
  })
);

app.use("/api/users", usersRouter); // 라우터 등록
app.use("/api/accounts", accountRouter); // 라우터 등록
app.use("/api/salary", salaryRouter); // 라우터 등록

app.get("/", async (req, res) => {
  try {
    if (req.session.user) {
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
  console.log(`Server running on port ${port}`);
});
