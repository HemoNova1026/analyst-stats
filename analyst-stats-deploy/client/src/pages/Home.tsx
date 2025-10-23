import { useEffect, useState } from "react";
import AnalystChartDialog from "@/components/AnalystChartDialog";

interface AnalystData {
  name: string;
  date: string;
  totalFriends: number;
  reachable: number;
  blocked: number;
  blockRate: string;
  yesterdayAdded: number;
  yesterdayBlocked: number;
}

interface AnalystStats {
  name: string;
  totalFriends: number;
  yesterdayAdded: number;
  weekAdded: number;
  monthAdded: number;
  yesterdayBlocked: number;
  weekBlocked: number;
  monthBlocked: number;
  latestDate: string;
}

interface CompanyAnalysts {
  company: string;
  analysts: AnalystStats[];
}

export default function Home() {
  const [companyData, setCompanyData] = useState<CompanyAnalysts[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [allAnalystData, setAllAnalystData] = useState<Map<string, AnalystData[]>>(new Map());
  
  // 圖表對話框狀態
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>("");
  const [selectedAnalystData, setSelectedAnalystData] = useState<AnalystData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 載入分析師分類
        const mappingResponse = await fetch("/analyst_mapping.json");
        const mapping = await mappingResponse.json();

        // 載入CSV資料
        const response = await fetch("/analyst_data.csv");
        const text = await response.text();
        const lines = text.trim().split("\n");
        
        // 跳過表頭
        const dataLines = lines.slice(1);
        
        // 解析CSV資料
        const allData: AnalystData[] = dataLines.map(line => {
          const [name, date, totalFriends, reachable, blocked, blockRate, yesterdayAdded, yesterdayBlocked] = line.split(",");
          return {
            name,
            date,
            totalFriends: parseInt(totalFriends),
            reachable: parseInt(reachable),
            blocked: parseInt(blocked),
            blockRate,
            yesterdayAdded: parseInt(yesterdayAdded),
            yesterdayBlocked: parseInt(yesterdayBlocked)
          };
        });

        // 按分析師分組
        const analystMap = new Map<string, AnalystData[]>();
        allData.forEach(data => {
          if (!analystMap.has(data.name)) {
            analystMap.set(data.name, []);
          }
          analystMap.get(data.name)!.push(data);
        });

        // 儲存所有分析師資料供圖表使用
        setAllAnalystData(analystMap);

        // 計算每位分析師的統計數據
        const statsMap = new Map<string, AnalystStats>();
        analystMap.forEach((records, name) => {
          // 按日期排序
          records.sort((a, b) => a.date.localeCompare(b.date));
          
          const latest = records[records.length - 1];
          const latestDate = latest.date;
          
          // 設定當前日期(使用最新的日期)
          if (!currentDate) {
            const year = latestDate.substring(0, 4);
            const month = latestDate.substring(4, 6);
            const day = latestDate.substring(6, 8);
            setCurrentDate(`${year}/${month}/${day}`);
          }

          // 昨日新增和封鎖
          const yesterdayAdded = latest.yesterdayAdded;
          const yesterdayBlocked = latest.yesterdayBlocked;

          // 本周新增和封鎖 (最近7天)
          const weekRecords = records.slice(-7);
          const weekAdded = weekRecords.reduce((sum, r) => sum + r.yesterdayAdded, 0);
          const weekBlocked = weekRecords.reduce((sum, r) => sum + r.yesterdayBlocked, 0);

          // 本月新增和封鎖 (當月所有記錄)
          const currentMonth = latestDate.substring(0, 6);
          const monthRecords = records.filter(r => r.date.substring(0, 6) === currentMonth);
          const monthAdded = monthRecords.reduce((sum, r) => sum + r.yesterdayAdded, 0);
          const monthBlocked = monthRecords.reduce((sum, r) => sum + r.yesterdayBlocked, 0);

          statsMap.set(name, {
            name,
            totalFriends: latest.totalFriends,
            yesterdayAdded,
            weekAdded,
            monthAdded,
            yesterdayBlocked,
            weekBlocked,
            monthBlocked,
            latestDate
          });
        });

        // 按公司分組,確保大來在前,大華在後
        const companies: CompanyAnalysts[] = [];
        const companyOrder = ["大來投顧", "大華投顧"];
        
        for (const company of companyOrder) {
          const analystNames = mapping[company];
          if (analystNames) {
            const analysts: AnalystStats[] = [];
            for (const name of analystNames as string[]) {
              const stats = statsMap.get(name);
              if (stats) {
                analysts.push(stats);
              }
            }
            companies.push({ company, analysts });
          }
        }

        setCompanyData(companies);
        setLoading(false);
      } catch (error) {
        console.error("載入資料失敗:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAnalystClick = (analystName: string) => {
    const data = allAnalystData.get(analystName);
    if (data) {
      // 按日期排序
      const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
      setSelectedAnalyst(analystName);
      setSelectedAnalystData(sortedData);
      setChartDialogOpen(true);
    }
  };

  const getCompanyColors = (company: string) => {
    if (company === "大來投顧") {
      return {
        headerBg: "bg-blue-600",
        border: "border-blue-700"
      };
    } else {
      return {
        headerBg: "bg-red-600",
        border: "border-red-700"
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container max-w-6xl">
        {companyData.map((company, idx) => {
          const colors = getCompanyColors(company.company);
          
          return (
            <div key={company.company} className={idx > 0 ? "mt-20" : ""}>
              {/* 表格容器 */}
              <div className={`border-2 ${colors.border} overflow-hidden shadow-lg`}>
                {/* 表格標題 */}
                <div className={`${colors.headerBg} text-white py-3 px-4 border-b-2 ${colors.border}`}>
                  <h2 className="text-xl font-bold text-center">
                    {company.company}分析師LINE@、YT人數(週)統計表
                  </h2>
                </div>

                {/* 表格 */}
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-gray-800">
                        分析師
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-red-600">
                        {currentDate}
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-green-600">
                        昨日新增
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-blue-600">
                        本周增長
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-purple-600">
                        本月增長
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-orange-600">
                        昨日封鎖
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-rose-600">
                        本周封鎖
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center text-xs font-bold text-red-700">
                        本月封鎖
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.analysts.map((analyst) => (
                      <tr 
                        key={analyst.name}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => handleAnalystClick(analyst.name)}
                      >
                        <td className="border border-gray-300 px-2 py-2 text-center font-medium text-gray-800 bg-white hover:text-blue-600">
                          {analyst.name}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-gray-900 bg-white">
                          {analyst.totalFriends.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-semibold bg-white">
                          <span className={analyst.yesterdayAdded >= 0 ? "text-green-600" : "text-red-600"}>
                            {analyst.yesterdayAdded >= 0 ? "+" : ""}{analyst.yesterdayAdded}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-semibold bg-white">
                          <span className={analyst.weekAdded >= 0 ? "text-blue-600" : "text-red-600"}>
                            {analyst.weekAdded >= 0 ? "+" : ""}{analyst.weekAdded}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-semibold bg-white">
                          <span className={analyst.monthAdded >= 0 ? "text-purple-600" : "text-red-600"}>
                            {analyst.monthAdded >= 0 ? "+" : ""}{analyst.monthAdded}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-semibold bg-white">
                          <span className="text-orange-600">
                            {analyst.yesterdayBlocked}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-semibold bg-white">
                          <span className="text-rose-600">
                            {analyst.weekBlocked}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-semibold bg-white">
                          <span className="text-red-700">
                            {analyst.monthBlocked}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* 圖表對話框 */}
      <AnalystChartDialog
        open={chartDialogOpen}
        onOpenChange={setChartDialogOpen}
        analystName={selectedAnalyst}
        data={selectedAnalystData}
      />
    </div>
  );
}

