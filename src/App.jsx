import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  Target,
  Sparkles,
  TrendingUp,
  Shield,
  BarChart3,
} from "lucide-react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import AdminDashboard from "./AdminDashboard";

const App = () => {
  const [checkedItems, setCheckedItems] = useState({});
  const [currentPage, setCurrentPage] = useState("checklist");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisText, setAnalysisText] = useState("");
  const [startTime, setStartTime] = useState(Date.now());

  // URL에서 관리자 모드 확인
  const isAdminMode =
    window.location.pathname === "/admin" || window.location.hash === "#admin";

  const checklistItems = [
    { id: 1, text: "일어나자마자 핸드폰으로 유튜브나 인스타 봤다" },
    { id: 2, text: '"내일 하자"고 미룬 적이 이번 주에 3번 이상 있다' },
    { id: 3, text: "공부하겠다고 폰 들었다가 유튜브/인스타 본 적 있다" },
    { id: 4, text: '자기 전에 "오늘 뭐 했지?" 하며 허무했던 적 있다' },
    { id: 5, text: '"다음 주부터 진짜 할 거야!" 라고 생각한 적 있다' },
    { id: 6, text: "해야 할 일 생각하며 누워만 있다가 하루 끝난 적 있다" },
    { id: 7, text: '"내일부터는 진짜다"가 이번 달에만 4번째다' },
    { id: 8, text: '"5분만 더..." 하고 알람 3번 넘게 끈 적 있다' },
    {
      id: 9,
      text: '"바쁘다"고 말하지만, 정작 하루가 어떻게 지나갔는지 기억이 없다',
    },
    { id: 10, text: '"일단 청소부터..." 하며 해야할 일들을 안 한 적 있다' },
  ];

  const analysisTexts = [
    "데이터를 수집하고 있습니다...",
    "패턴을 분석하고 있습니다...",
    "습관을 평가하고 있습니다...",
    "점수를 계산하고 있습니다...",
    "솔루션을 찾고 있습니다...",
    "결과를 정리하고 있습니다...",
    "완료되었습니다!",
  ];

  const handleCheckboxChange = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCheckedCount = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  const startAnalysis = () => {
    setCurrentPage("analyzing");
    setAnalysisProgress(0);
    setAnalysisText(analysisTexts[0]);
  };

  // 데이터 수집 함수
  const saveUserData = async (resultData) => {
    try {
      const userData = {
        // 핵심 진단 데이터
        checkedItems: checkedItems,
        checkedCount: getCheckedCount(),
        checkedItemIds: Object.keys(checkedItems).filter(
          (key) => checkedItems[key]
        ),
        resultLevel: resultData.level,

        // 타임스탬프
        timestamp: new Date().toISOString(),
        date: new Date().toDateString(),
        time: new Date().toTimeString().split(" ")[0],

        // 사용 패턴
        timeSpentSeconds: Math.round((Date.now() - startTime) / 1000),

        // 기기 정보
        isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
        screenWidth: window.screen.width,
        userAgent: navigator.userAgent.split(" ")[0],
      };

      // Firebase에 저장
      await addDoc(collection(db, "survey-results"), userData);
      console.log("데이터 저장 성공!", userData);
    } catch (error) {
      console.error("데이터 저장 실패:", error);
    }
  };

  useEffect(() => {
    if (currentPage === "analyzing") {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          const newProgress = prev + 1;

          // 텍스트 업데이트
          const textIndex = Math.floor(
            (newProgress / 100) * analysisTexts.length
          );
          if (textIndex < analysisTexts.length) {
            setAnalysisText(analysisTexts[textIndex]);
          }

          // 100%에 도달하면 결과 페이지로 이동
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setCurrentPage("result");
              // 결과 페이지 표시 후 데이터 수집
              setTimeout(() => {
                saveUserData(getResult());
              }, 500);
            }, 500);
          }

          return newProgress;
        });
      }, 20);

      return () => clearInterval(interval);
    }
  }, [currentPage]);

  const getResult = () => {
    const count = getCheckedCount();

    if (count <= 1) {
      return {
        title: "리더핑",
        level: "완벽",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        gradientColor: "from-green-400 to-emerald-500",
        icon: <Star className="w-16 h-16 text-green-600" />,
        image: "/assets/2.png",
        description: "시간관리의 신! 당신은 타고난 리더입니다.",
        message:
          "당신은 리더의 자질이 충분합니다.\n가까운 조장님이나 팸장님께\n바로 지원하세요.",
        score: 100,
      };
    } else if (count <= 4) {
      return {
        title: "계획핑",
        level: "우수",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        gradientColor: "from-blue-400 to-cyan-500",
        icon: <Target className="w-16 h-16 text-blue-600" />,
        image: "/assets/4.png",
        description: "계획은 완벽! 실행은... 다음 생에?",
        message:
          '"계획은 예술, 실천은 다음 생에!"\n오늘도 형광펜만 열일한 계획핑!',
        score: 75,
      };
    } else if (count <= 7) {
      return {
        title: "작심삼일핑",
        level: "보통",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        gradientColor: "from-yellow-400 to-orange-500",
        icon: <TrendingUp className="w-16 h-16 text-yellow-600" />,
        image: "/assets/3.png",
        description: "처음 3일은 완벽했는데...",
        message:
          '"계획은 완벽했지…\n첫 3일 동안은 말이야."\n작심삼일핑, 오늘도 당당하게 실패 중!',
        score: 50,
      };
    } else {
      return {
        title: "노답핑",
        level: "위험",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        gradientColor: "from-red-400 to-pink-500",
        icon: <Sparkles className="w-16 h-16 text-red-600" />,
        image: "/assets/1.png",
        description: "일어나자마자 폰, 계획은 내일로...",
        message:
          "일어나자마자 폰 보고,\n공부는 내일로 미루고,\n누웠는데 하루가 끝났다면...?\n축하해요! 당신은 오늘도 노답 마스터✨",
        score: 20,
      };
    }
  };

  const resetTest = () => {
    setCheckedItems({});
    setCurrentPage("checklist");
    setAnalysisProgress(0);
    setStartTime(Date.now());
  };

  const result = getResult();

  // 관리자 대시보드 표시
  if (isAdminMode) {
    return <AdminDashboard onBack={() => (window.location.href = "/")} />;
  }

  // 체크리스트 페이지
  if (currentPage === "checklist") {
    return (
      <div className="max-w-md mx-auto p-4 bg-white min-h-screen">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ⏰ 사섬 청년들의 시간관리 진단
          </h1>
          <p className="text-sm text-gray-600">솔직하게 체크해주세요!</p>
        </div>

        <div className="space-y-3 mb-6">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border active:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  id={`item-${item.id}`}
                  checked={checkedItems[item.id] || false}
                  onChange={() => handleCheckboxChange(item.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                />
              </div>
              <label
                htmlFor={`item-${item.id}`}
                className="flex-1 text-sm text-gray-700 cursor-pointer leading-relaxed"
              >
                {item.text}
              </label>
            </div>
          ))}
        </div>

        <div className="sticky bottom-4 bg-white pt-4">
          <div className="text-center mb-3 text-sm font-medium text-gray-700">
            ✅ {getCheckedCount()}개 / 10개 체크됨
          </div>
          <button
            onClick={startAnalysis}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all duration-200 hover:shadow-xl"
          >
            🔍 진단 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 분석 중 페이지
  if (currentPage === "analyzing") {
    return (
      <div className="max-w-md mx-auto p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center w-full">
          {/* 메인 진행률 원형 */}
          <div className="relative mx-auto w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>

            {/* 중앙 진행률 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {analysisProgress}%
              </div>
              <div className="text-xs text-gray-500">분석중</div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6">
            분석 중입니다
          </h2>

          <p className="text-base text-gray-600 mb-8 px-4">{analysisText}</p>

          {/* 진행률 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>

          <div className="text-sm text-gray-500">잠시만 기다려주세요...</div>
        </div>
      </div>
    );
  }

  // 결과 페이지
  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">📊 진단 완료!</h1>
        <p className="text-sm text-gray-600">시간관리 분석 결과</p>
      </div>

      <div
        className={`p-6 rounded-2xl border-2 ${result.bgColor} ${result.borderColor} shadow-xl mb-4`}
      >
        {/* 프로필 이미지 */}
        <div className="text-center mb-6">
          <div className="relative mx-auto w-48 h-48 mb-4">
            <img
              src={result.image}
              alt="Result Profile"
              className="w-full h-full rounded-lg object-cover border-4 border-white shadow-lg"
            />
            <div className="absolute -bottom-2 -right-2 text-4xl">
              {result.level === "완벽"
                ? "👑"
                : result.level === "우수"
                ? "⭐"
                : result.level === "보통"
                ? "💪"
                : result.level === "주의"
                ? "🔥"
                : "🌟"}
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">당신은</h2>
            <div className={`text-3xl font-black ${result.color} mb-2`}>
              {result.title}
            </div>
            <div className="text-lg font-bold text-gray-800">입니다!</div>
          </div>

          <div className="mb-4">
            <div className="text-xs text-gray-600 mb-2">
              체크 항목: {getCheckedCount()}개 / 10개
            </div>
            <div className="bg-gray-200 rounded-full h-4 w-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  getCheckedCount() === 0
                    ? "bg-gray-400"
                    : getCheckedCount() <= 2
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : getCheckedCount() <= 4
                    ? "bg-gradient-to-r from-blue-400 to-blue-500"
                    : getCheckedCount() <= 6
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                    : getCheckedCount() <= 8
                    ? "bg-gradient-to-r from-orange-400 to-orange-500"
                    : "bg-gradient-to-r from-red-400 to-red-500"
                }`}
                style={{
                  width: `${
                    getCheckedCount() === 0
                      ? 10
                      : (getCheckedCount() / 10) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-4">{result.description}</p>
        </div>

        {/* 메시지 박스 */}
        <div className="bg-white p-4 rounded-xl shadow-inner">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {result.message}
          </p>
        </div>
      </div>

      {/* 하단 버튼들 */}
      <div className="space-y-3">
        <button
          onClick={resetTest}
          className="w-full py-3 bg-gray-600 text-white rounded-xl font-semibold active:scale-95 transition-all duration-200"
        >
          🔄 다시 진단하기
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "시간관리 진단 결과",
                text: `나의 시간관리 진단: ${result.title} (${result.score}점)`,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(
                `나의 시간관리 진단: ${result.title} (${result.score}점) - ${window.location.href}`
              );
              alert("결과가 클립보드에 복사되었습니다!");
            }
          }}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold active:scale-95 transition-all duration-200"
        >
          📱 결과 공유하기
        </button>
      </div>
    </div>
  );
};

export default App;
