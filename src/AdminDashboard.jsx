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
  Calendar,
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
    rawData: [],
    weeklyStats: [],
    monthlyStats: [],
  });

  const [viewMode, setViewMode] = useState("daily"); // daily, weekly, monthly
  const [selectedDate, setSelectedDate] = useState("all"); // 선택된 날짜 필터

  // 날짜별로 필터링된 데이터 가져오기
  const getFilteredData = () => {
    if (selectedDate === "all") {
      return stats.rawData;
    }

    return stats.rawData.filter((item) => {
      let itemDate;
      if (item.timestamp) {
        itemDate = new Date(item.timestamp).toISOString().split("T")[0];
      } else if (item.date) {
        itemDate = new Date(item.date).toISOString().split("T")[0];
      } else {
        itemDate = new Date().toISOString().split("T")[0];
      }
      return itemDate === selectedDate;
    });
  };

  // 필터링된 데이터로 등급 분포 계산
  const getFilteredLevelDistribution = () => {
    const filteredData = getFilteredData();

    if (filteredData.length === 0) {
      return [];
    }

    const levelCount = {};
    filteredData.forEach((item) => {
      const level = item.resultLevel;
      // 4개 핑 중 하나인 경우만 카운트
      if (level && ["완벽", "우수", "보통", "위험"].includes(level)) {
        levelCount[level] = (levelCount[level] || 0) + 1;
      }
    });

    // 4개 핑만 처리
    const levelColors = {
      완벽: "#10B981", // 리더핑
      우수: "#3B82F6", // 계획핑
      보통: "#F59E0B", // 작심삼일핑
      위험: "#EF4444", // 노답핑
    };

    // 핑 이름으로 매핑
    const levelNames = {
      완벽: "리더핑",
      우수: "계획핑",
      보통: "작심삼일핑",
      위험: "노답핑",
    };

    return Object.entries(levelCount).map(([level, value]) => ({
      name: levelNames[level],
      originalLevel: level,
      value,
      percentage: Math.round((value / filteredData.length) * 100),
      color: levelColors[level],
    }));
  };

  // 필터링된 데이터로 인기 항목 계산
  const getFilteredPopularItems = () => {
    const filteredData = getFilteredData();

    if (filteredData.length === 0) {
      return [];
    }

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

    filteredData.forEach((item) => {
      if (Array.isArray(item.checkedItemIds)) {
        item.checkedItemIds.forEach((id) => {
          const idStr = String(id);
          itemCount[idStr] = (itemCount[idStr] || 0) + 1;
        });
      } else if (item.checkedItems) {
        Object.entries(item.checkedItems).forEach(([id, checked]) => {
          if (checked) {
            itemCount[id] = (itemCount[id] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(itemCount)
      .map(([id, count]) => ({
        item: `${id}. ${itemNames[id] || "알 수 없는 항목"}`,
        count,
        percentage: Math.round((count / filteredData.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // 사용 가능한 날짜 목록 가져오기
  const getAvailableDates = () => {
    const dates = new Set();

    stats.rawData.forEach((item) => {
      let itemDate;
      if (item.timestamp) {
        itemDate = new Date(item.timestamp).toISOString().split("T")[0];
      } else if (item.date) {
        itemDate = new Date(item.date).toISOString().split("T")[0];
      } else {
        itemDate = new Date().toISOString().split("T")[0];
      }
      dates.add(itemDate);
    });

    return Array.from(dates).sort().reverse(); // 최신 날짜부터
  };

  // Firebase에서 실제 데이터 가져오기
  const fetchRealStats = async () => {
    setStats((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const querySnapshot = await getDocs(collection(db, "survey-results"));
      const allData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allData.push({ id: doc.id, ...data });
      });

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

      // 체크된 항목 수 계산
      const totalChecked = allData.reduce((sum, item) => {
        let count = 0;
        if (typeof item.checkedCount === "number") {
          count = item.checkedCount;
        } else if (Array.isArray(item.checkedItemIds)) {
          count = item.checkedItemIds.length;
        } else if (item.checkedItems) {
          count = Object.values(item.checkedItems).filter(Boolean).length;
        }
        return sum + count;
      }, 0);

      const averageChecked =
        totalResponses > 0 ? (totalChecked / totalResponses).toFixed(1) : 0;

      // 오늘 응답 수 계산
      const today = new Date().toDateString();
      const todayResponses = allData.filter((item) => {
        const itemDate =
          item.date ||
          (item.timestamp ? new Date(item.timestamp).toDateString() : null);
        return itemDate === today;
      });
      const todayCount = todayResponses.length;

      // 등급별 분포 계산 - 4개 핑만 처리
      const levelCount = {};
      allData.forEach((item) => {
        const level = item.resultLevel;
        // 4개 핑 중 하나인 경우만 카운트
        if (level && ["완벽", "우수", "보통", "위험"].includes(level)) {
          levelCount[level] = (levelCount[level] || 0) + 1;
        }
      });

      // 4개 핑만 처리
      const levelColors = {
        완벽: "#10B981", // 리더핑
        우수: "#3B82F6", // 계획핑
        보통: "#F59E0B", // 작심삼일핑
        위험: "#EF4444", // 노답핑
      };

      // 핑 이름으로 매핑
      const levelNames = {
        완벽: "리더핑",
        우수: "계획핑",
        보통: "작심삼일핑",
        위험: "노답핑",
      };

      const levelDistribution = Object.entries(levelCount).map(
        ([level, value]) => ({
          name: levelNames[level],
          originalLevel: level,
          value,
          percentage:
            totalResponses > 0 ? Math.round((value / totalResponses) * 100) : 0,
          color: levelColors[level],
        })
      );

      // 가장 많은 핑 찾기
      const mostCommonLevelKey = Object.entries(levelCount).reduce(
        (a, b) => (levelCount[a[0]] > levelCount[b[0]] ? a : b),
        ["완벽", 0]
      )[0];
      const mostCommonLevel = levelNames[mostCommonLevelKey];

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
        if (Array.isArray(item.checkedItemIds)) {
          item.checkedItemIds.forEach((id) => {
            const idStr = String(id);
            itemCount[idStr] = (itemCount[idStr] || 0) + 1;
          });
        } else if (item.checkedItems) {
          Object.entries(item.checkedItems).forEach(([id, checked]) => {
            if (checked) {
              itemCount[id] = (itemCount[id] || 0) + 1;
            }
          });
        }
      });

      const popularItems = Object.entries(itemCount)
        .map(([id, count]) => ({
          item: `${id}. ${itemNames[id] || "알 수 없는 항목"}`,
          count,
          percentage:
            totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 향상된 날짜별 통계 (최근 30일)
      const dateCount = {};
      const dateDetails = {};

      allData.forEach((item) => {
        let dateObj;
        if (item.timestamp) {
          dateObj = new Date(item.timestamp);
        } else if (item.date) {
          dateObj = new Date(item.date);
        } else {
          dateObj = new Date();
        }

        const dateKey = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD 형식
        const displayDate = dateObj.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        });

        dateCount[dateKey] = (dateCount[dateKey] || 0) + 1;

        if (!dateDetails[dateKey]) {
          dateDetails[dateKey] = {
            displayDate,
            responses: 0,
            levels: {},
            avgChecked: 0,
            totalChecked: 0,
          };
        }

        dateDetails[dateKey].responses++;

        // 레벨별 카운트 (핑 이름으로 변환)
        const level = item.resultLevel;
        if (level && ["완벽", "우수", "보통", "위험"].includes(level)) {
          const levelNames = {
            완벽: "리더핑",
            우수: "계획핑",
            보통: "작심삼일핑",
            위험: "노답핑",
          };
          const displayLevel = levelNames[level];
          dateDetails[dateKey].levels[displayLevel] =
            (dateDetails[dateKey].levels[displayLevel] || 0) + 1;
        }

        // 체크 수 계산
        let checkedCount = 0;
        if (typeof item.checkedCount === "number") {
          checkedCount = item.checkedCount;
        } else if (Array.isArray(item.checkedItemIds)) {
          checkedCount = item.checkedItemIds.length;
        } else if (item.checkedItems) {
          checkedCount = Object.values(item.checkedItems).filter(
            Boolean
          ).length;
        }
        dateDetails[dateKey].totalChecked += checkedCount;
      });

      // 평균 계산
      Object.keys(dateDetails).forEach((date) => {
        dateDetails[date].avgChecked =
          dateDetails[date].responses > 0
            ? (
                dateDetails[date].totalChecked / dateDetails[date].responses
              ).toFixed(1)
            : 0;
      });

      // 최근 30일 데이터 생성
      const dailyStats = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        const displayDate = date.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        });

        dailyStats.push({
          date: displayDate,
          fullDate: dateKey,
          responses: dateCount[dateKey] || 0,
          details: dateDetails[dateKey] || {
            displayDate,
            responses: 0,
            levels: {},
            avgChecked: 0,
          },
        });
      }

      // 주별 통계 (최근 12주)
      const weeklyStats = [];
      for (let i = 11; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - i * 7);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const weekData = allData.filter((item) => {
          const itemDate = item.timestamp
            ? new Date(item.timestamp)
            : new Date(item.date || new Date());
          return itemDate >= startDate && itemDate <= endDate;
        });

        weeklyStats.push({
          week: `${startDate.getMonth() + 1}/${startDate.getDate()}`,
          responses: weekData.length,
          avgChecked:
            weekData.length > 0
              ? (
                  weekData.reduce((sum, item) => {
                    let count = 0;
                    if (typeof item.checkedCount === "number") {
                      count = item.checkedCount;
                    } else if (Array.isArray(item.checkedItemIds)) {
                      count = item.checkedItemIds.length;
                    } else if (item.checkedItems) {
                      count = Object.values(item.checkedItems).filter(
                        Boolean
                      ).length;
                    }
                    return sum + count;
                  }, 0) / weekData.length
                ).toFixed(1)
              : 0,
        });
      }

      // 월별 통계 (최근 6개월)
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();

        const monthData = allData.filter((item) => {
          const itemDate = item.timestamp
            ? new Date(item.timestamp)
            : new Date(item.date || new Date());
          return (
            itemDate.getFullYear() === year && itemDate.getMonth() === month
          );
        });

        monthlyStats.push({
          month: date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "short",
          }),
          responses: monthData.length,
          avgChecked:
            monthData.length > 0
              ? (
                  monthData.reduce((sum, item) => {
                    let count = 0;
                    if (typeof item.checkedCount === "number") {
                      count = item.checkedCount;
                    } else if (Array.isArray(item.checkedItemIds)) {
                      count = item.checkedItemIds.length;
                    } else if (item.checkedItems) {
                      count = Object.values(item.checkedItems).filter(
                        Boolean
                      ).length;
                    }
                    return sum + count;
                  }, 0) / monthData.length
                ).toFixed(1)
              : 0,
        });
      }

      const finalStats = {
        totalResponses,
        averageChecked: parseFloat(averageChecked),
        levelDistribution,
        popularItems,
        dailyStats,
        weeklyStats,
        monthlyStats,
        todayCount,
        mostCommonLevel,
        loading: false,
        error: null,
        rawData: allData,
      };

      setStats(finalStats);
    } catch (error) {
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

  // 현재 선택된 통계 데이터 가져오기
  const getCurrentStats = () => {
    switch (viewMode) {
      case "weekly":
        return {
          data: stats.weeklyStats,
          xKey: "week",
          yKey: "responses",
          title: "주별 응답 수 (최근 12주)",
        };
      case "monthly":
        return {
          data: stats.monthlyStats,
          xKey: "month",
          yKey: "responses",
          title: "월별 응답 수 (최근 6개월)",
        };
      default:
        return {
          data: stats.dailyStats,
          xKey: "date",
          yKey: "responses",
          title: "일별 응답 수 (최근 30일)",
        };
    }
  };

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

  const currentStats = getCurrentStats();

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
                <h3 className="text-sm font-medium text-gray-500">최다 핑</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.mostCommonLevel || "리더핑"}
                </p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 등급 분포 파이차트 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">📈 핑별 분포</h2>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 기간</option>
                  {getAvailableDates().map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(() => {
              const filteredLevelDistribution = getFilteredLevelDistribution();
              return filteredLevelDistribution.length > 0 ? (
                <div>
                  <div className="mb-2 text-sm text-gray-600">
                    {selectedDate === "all"
                      ? `전체 ${stats.totalResponses}개 응답`
                      : `${new Date(selectedDate).toLocaleDateString(
                          "ko-KR"
                        )} - ${getFilteredData().length}개 응답`}
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={filteredLevelDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percentage }) =>
                          `${name} ${percentage}%`
                        }
                      >
                        {filteredLevelDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "응답 수"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  {selectedDate === "all"
                    ? "아직 데이터가 없습니다"
                    : "해당 날짜에 데이터가 없습니다"}
                </div>
              );
            })()}
          </div>

          {/* 시간별 응답 수 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{currentStats.title}</h2>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">일별</option>
                  <option value="weekly">주별</option>
                  <option value="monthly">월별</option>
                </select>
              </div>
            </div>
            {currentStats.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentStats.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={currentStats.xKey}
                    tick={{ fontSize: 12 }}
                    angle={viewMode === "daily" ? -45 : 0}
                    textAnchor={viewMode === "daily" ? "end" : "middle"}
                    height={viewMode === "daily" ? 60 : 30}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [value, "응답 수"]}
                    labelFormatter={(label) => {
                      if (viewMode === "daily") {
                        const item = currentStats.data.find(
                          (d) => d.date === label
                        );
                        return item ? `${label} (${item.fullDate})` : label;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey={currentStats.yKey} fill="#3B82F6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                아직 데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 일별 상세 통계 (일별 모드일 때만 표시) */}
        {viewMode === "daily" &&
          stats.dailyStats.some((day) => day.responses > 0) && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
              <h2 className="text-xl font-semibold mb-4">📅 일별 상세 통계</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">날짜</th>
                      <th className="text-center py-2">응답 수</th>
                      <th className="text-center py-2">평균 체크</th>
                      <th className="text-left py-2">핑 분포</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.dailyStats
                      .filter((day) => day.responses > 0)
                      .reverse()
                      .slice(0, 10)
                      .map((day, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 font-medium">
                            {day.date}
                            <div className="text-xs text-gray-500">
                              {day.fullDate}
                            </div>
                          </td>
                          <td className="text-center py-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {day.responses}명
                            </span>
                          </td>
                          <td className="text-center py-2">
                            <span className="font-medium">
                              {day.details.avgChecked}
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(day.details.levels || {}).map(
                                ([level, count]) => (
                                  <span
                                    key={level}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      level === "리더핑"
                                        ? "bg-green-100 text-green-800"
                                        : level === "계획핑"
                                        ? "bg-blue-100 text-blue-800"
                                        : level === "작심삼일핑"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : level === "노답핑"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {level}({count})
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* 인기 항목 순위 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              🔥 가장 많이 체크된 항목들
            </h2>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 기간</option>
                {getAvailableDates().map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(() => {
            const filteredPopularItems = getFilteredPopularItems();
            return filteredPopularItems.length > 0 ? (
              <div>
                <div className="mb-4 text-sm text-gray-600">
                  {selectedDate === "all"
                    ? `전체 기간 기준`
                    : `${new Date(selectedDate).toLocaleDateString(
                        "ko-KR"
                      )} 기준`}
                </div>
                <div className="space-y-4">
                  {filteredPopularItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
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
                            style={{
                              width: `${Math.max(item.percentage, 5)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {selectedDate === "all"
                  ? "아직 체크된 항목이 없습니다"
                  : "해당 날짜에 체크된 항목이 없습니다"}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
