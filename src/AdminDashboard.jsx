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
  });

  // Firebase에서 실제 데이터 가져오기
  const fetchRealStats = async () => {
    try {
      console.log("데이터를 가져오는 중...");
      const querySnapshot = await getDocs(collection(db, "survey-results"));
      const allData = [];

      querySnapshot.forEach((doc) => {
        allData.push(doc.data());
      });

      console.log("가져온 데이터:", allData);

      // 통계 계산
      const totalResponses = allData.length;
      const totalChecked = allData.reduce(
        (sum, item) => sum + (item.checkedCount || 0),
        0
      );
      const averageChecked =
        totalResponses > 0 ? (totalChecked / totalResponses).toFixed(1) : 0;

      // 오늘 응답 수
      const today = new Date().toDateString();
      const todayCount = allData.filter((item) => item.date === today).length;

      // 등급별 분포
      const levelCount = {};
      allData.forEach((item) => {
        const level = item.resultLevel || "기타";
        levelCount[level] = (levelCount[level] || 0) + 1;
      });

      const levelDistribution = Object.entries(levelCount).map(
        ([name, value]) => ({
          name,
          value,
          percentage:
            totalResponses > 0 ? Math.round((value / totalResponses) * 100) : 0,
          color:
            name === "완벽"
              ? "#10B981"
              : name === "우수"
              ? "#3B82F6"
              : name === "보통"
              ? "#F59E0B"
              : "#EF4444",
        })
      );

      // 가장 많은 등급
      const mostCommonLevel = Object.entries(levelCount).reduce(
        (a, b) => (levelCount[a[0]] > levelCount[b[0]] ? a : b),
        ["기타", 0]
      )[0];

      // 인기 항목 분석
      const itemCount = {};
      allData.forEach((item) => {
        if (item.checkedItemIds) {
          item.checkedItemIds.forEach((id) => {
            itemCount[id] = (itemCount[id] || 0) + 1;
          });
        }
      });

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

      const popularItems = Object.entries(itemCount)
        .map(([id, count]) => ({
          item: `${id}. ${itemNames[id] || "기타"}`,
          count,
          percentage:
            totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 날짜별 통계 (최근 7일)
      const dateCount = {};
      allData.forEach((item) => {
        const date = item.date || new Date().toDateString();
        const shortDate = date.split(" ").slice(1, 3).join(" ");
        dateCount[shortDate] = (dateCount[shortDate] || 0) + 1;
      });

      const dailyStats = Object.entries(dateCount)
        .map(([date, responses]) => ({ date, responses }))
        .slice(-7);

      console.log("계산된 통계:", {
        totalResponses,
        averageChecked,
        todayCount,
        mostCommonLevel,
        levelDistribution,
        popularItems,
      });

      setStats({
        totalResponses,
        averageChecked,
        levelDistribution,
        popularItems,
        dailyStats,
        todayCount,
        mostCommonLevel,
        loading: false,
      });
    } catch (error) {
      console.error("통계 데이터 로드 실패:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchRealStats();
  }, []);

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
        <div className="bg-white p-6 rounded-lg shadow-sm border">
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

        {/* 디버그 정보 (개발용) */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
          <p>
            디버그 정보: 총 {stats.totalResponses}개 응답, 평균{" "}
            {stats.averageChecked}개 체크
          </p>
          <p>
            레벨 분포:{" "}
            {stats.levelDistribution
              .map((l) => `${l.name}:${l.value}`)
              .join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
