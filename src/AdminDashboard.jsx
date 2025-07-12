import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Clock,
  Award,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const AdminDashboard = ({ onBack }) => {
  const [stats, setStats] = useState({
    totalResponses: 0,
    averageChecked: 0,
    levelDistribution: [],
    popularItems: [],
    dailyStats: [],
    todayCount: 0,
    mostCommonLevel: "",
    loading: true,
    error: null,
    rawData: [], // 디버깅용
  });

  // Firebase에서 실제 데이터 가져오기
  const fetchRealStats = async () => {
    setStats((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log("📊 Firebase에서 데이터를 가져오는 중...");
      const querySnapshot = await getDocs(collection(db, "survey-results"));
      const allData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📄 문서 데이터:", data);
        allData.push({ id: doc.id, ...data });
      });

      console.log(`✅ 총 ${allData.length}개의 문서를 가져왔습니다:`, allData);

      if (allData.length === 0) {
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: "아직 수집된 데이터가 없습니다. 먼저 진단을 완료해보세요!",
        }));
        return;
      }

      // 통계 계산
      const totalResponses = allData.length;
      console.log(`📈 총 응답 수: ${totalResponses}`);

      // 체크된 항목 수 계산 (여러 필드 확인)
      const totalChecked = allData.reduce((sum, item) => {
        // checkedCount가 있으면 사용, 없으면 checkedItemIds 길이 사용, 둘 다 없으면 checkedItems 객체에서 계산
        let count = 0;
        if (typeof item.checkedCount === "number") {
          count = item.checkedCount;
        } else if (Array.isArray(item.checkedItemIds)) {
          count = item.checkedItemIds.length;
        } else if (item.checkedItems) {
          count = Object.values(item.checkedItems).filter(Boolean).length;
        }
        console.log(`📋 문서 ${item.id}: ${count}개 체크`);
        return sum + count;
      }, 0);

      const averageChecked =
        totalResponses > 0 ? (totalChecked / totalResponses).toFixed(1) : 0;
      console.log(`📊 평균 체크 수: ${averageChecked}`);

      // 오늘 응답 수 계산
      const today = new Date().toDateString();
      const todayResponses = allData.filter((item) => {
        const itemDate =
          item.date ||
          (item.timestamp ? new Date(item.timestamp).toDateString() : null);
        return itemDate === today;
      });
      const todayCount = todayResponses.length;
      console.log(`📅 오늘 응답 수: ${todayCount}`);

      // 등급별 분포 계산
      const levelCount = {};
      allData.forEach((item) => {
        const level = item.resultLevel || "알 수 없음";
        levelCount[level] = (levelCount[level] || 0) + 1;
      });

      console.log("📊 등급별 개수:", levelCount);

      const levelColors = {
        완벽: "#10B981", // 초록
        우수: "#3B82F6", // 파랑
        보통: "#F59E0B", // 노랑
        위험: "#EF4444", // 빨강
        주의: "#F97316", // 주황
        "알 수 없음": "#6B7280", // 회색
      };

      const levelDistribution = Object.entries(levelCount).map(
        ([name, value]) => ({
          name,
          value,
          percentage:
            totalResponses > 0 ? Math.round((value / totalResponses) * 100) : 0,
          color: levelColors[name] || "#6B7280",
        })
      );

      // 가장 많은 등급 찾기
      const mostCommonLevel = Object.entries(levelCount).reduce(
        (a, b) => (levelCount[a[0]] > levelCount[b[0]] ? a : b),
        ["알 수 없음", 0]
      )[0];

      console.log("🏆 가장 많은 등급:", mostCommonLevel);

      // 인기 항목 분석
      const itemCount = {};
      const itemNames = {
        1: "일어나자마자 핸드폰으로 유튜브나 인스타 봤다",
        2: "내일 하자고 미룬 적이 이번 주에 3번 이상 있다",
        3: "공부하겠다고 폰 들었다가 유튜브/인스타 본 적 있다",
        4: "자기 전에 오늘 뭐 했지? 하며 허무했던 적 있다",
        5: "다음 주부터 진짜 할 거야! 라고 생각한 적 있다",
        6: "해야 할 일 생각하며 누워만 있다가 하루 끝난 적 있다",
        7: "내일부터는 진짜다가 이번 달에만 4번째다",
        8: "5분만 더... 하고 알람 3번 넘게 끈 적 있다",
        9: "바쁘다고 하지만 기억이 없다",
        10: "일단 청소부터... 하며 해야할 일들을 안 한 적 있다",
      };

      allData.forEach((item) => {
        // checkedItemIds 배열이 있는 경우
        if (Array.isArray(item.checkedItemIds)) {
          item.checkedItemIds.forEach((id) => {
            const idStr = String(id);
            itemCount[idStr] = (itemCount[idStr] || 0) + 1;
          });
        }
        // checkedItems 객체가 있는 경우
        else if (item.checkedItems) {
          Object.entries(item.checkedItems).forEach(([id, checked]) => {
            if (checked) {
              itemCount[id] = (itemCount[id] || 0) + 1;
            }
          });
        }
      });

      console.log("🔥 항목별 체크 수:", itemCount);

      const popularItems = Object.entries(itemCount)
        .map(([id, count]) => ({
          item: `${id}. ${itemNames[id] || "알 수 없는 항목"}`,
          count,
          percentage:
            totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      console.log("🏅 인기 항목 TOP 5:", popularItems);

      // 날짜별 통계 (최근 7일)
      const dateCount = {};
      allData.forEach((item) => {
        let dateStr;
        if (item.date) {
          dateStr = item.date;
        } else if (item.timestamp) {
          dateStr = new Date(item.timestamp).toDateString();
        } else {
          dateStr = new Date().toDateString();
        }

        // "Mon Jan 15 2024" 형태를 "Jan 15"로 변환
        const shortDate = dateStr.split(" ").slice(1, 3).join(" ");
        dateCount[shortDate] = (dateCount[shortDate] || 0) + 1;
      });

      const dailyStats = Object.entries(dateCount)
        .map(([date, responses]) => ({ date, responses }))
        .sort((a, b) => new Date(a.date + " 2024") - new Date(b.date + " 2024"))
        .slice(-7);

      console.log("📅 일별 통계:", dailyStats);

      const finalStats = {
        totalResponses,
        averageChecked: parseFloat(averageChecked),
        levelDistribution,
        popularItems,
        dailyStats,
        todayCount,
        mostCommonLevel,
        loading: false,
        error: null,
        rawData: allData, // 디버깅용
      };

      console.log("✅ 최종 계산된 통계:", finalStats);
      setStats(finalStats);
    } catch (error) {
      console.error("❌ 통계 데이터 로드 실패:", error);
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: `데이터 로드 실패: ${error.message}`,
      }));
    }
  };

  useEffect(() => {
    fetchRealStats();
  }, []);

  // 로딩 중
  if (stats.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">통계 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (stats.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            오류 발생
          </h2>
          <p className="text-gray-600 mb-4">{stats.error}</p>
          <div className="space-y-2">
            <button
              onClick={fetchRealStats}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={onBack}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              📊 시간관리 진단 통계
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchRealStats}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>새로고침</span>
            </button>
            <div className="text-sm text-gray-500">
              마지막 업데이트: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* 주요 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  총 응답 수
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalResponses}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  평균 체크 수
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {stats.averageChecked}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  오늘 응답 수
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.todayCount}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">최다 등급</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.mostCommonLevel || "데이터 없음"}
                </p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 등급 분포 파이차트 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">📈 결과 등급별 분포</h2>
            {stats.levelDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.levelDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {stats.levelDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "응답 수"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                아직 데이터가 없습니다
              </div>
            )}
          </div>

          {/* 일별 응답 수 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">📅 날짜별 응답 수</h2>
            {stats.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="responses" fill="#3B82F6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                아직 데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 인기 항목 순위 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-4">
            🔥 가장 많이 체크된 항목들
          </h2>
          {stats.popularItems.length > 0 ? (
            <div className="space-y-4">
              {stats.popularItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        #{index + 1} {item.item}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.count}명 ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(item.percentage, 5)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              아직 체크된 항목이 없습니다
            </div>
          )}
        </div>

        {/* 디버그 정보 */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">🔍 디버그 정보</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              총 {stats.totalResponses}개 응답, 평균 {stats.averageChecked}개
              체크
            </p>
            <p>
              레벨 분포:{" "}
              {stats.levelDistribution
                .map((l) => `${l.name}:${l.value}`)
                .join(", ")}
            </p>
            <p>
              원본 데이터 샘플:{" "}
              {stats.rawData.length > 0
                ? JSON.stringify(stats.rawData[0], null, 2).substring(0, 200) +
                  "..."
                : "없음"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
