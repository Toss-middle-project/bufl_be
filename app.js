const express = require("express");
const cors = require("cors");
const db = require("./db/db"); // DB 설정 파일
const joinRouter = require("./api/join"); // 회원가입 라우터
const usersRouter = require("./api/users"); // 사용자 라우터 가져오기
const session = require("express-session");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/join", joinRouter);

// 세션 설정
app.use(
  session({
    secret: "123456", // 비밀 키
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // HTTPS를 사용할 경우 true로 설정
  })
);

app.use("/api/users", usersRouter); // 라우터 등록

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
