const consumptionService = require("../services/consumption-service");

// AI 소비 패턴 분석
exports.getConsumptionPattern = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const result = await consumptionService.analyzeConsumptionPattern(
      sessionId
    );
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// AI 카테고리 - 비율 추천
exports.getRecommendRatio = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const result = await consumptionService.getRecommendedRatio(sessionId);
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 카테고리 추가
exports.addCategory = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ message: "세션 없음" });

    const result = await consumptionService.saveRecommendedCategory(sessionId);
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
