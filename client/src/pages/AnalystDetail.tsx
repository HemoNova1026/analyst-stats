import { useState, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import allData from '@/data/all_data.json';

type TimeRange = 'year' | 'three_months' | 'one_month' | 'one_week' | 'yesterday';

export default function AnalystDetail() {
  const [, params] = useRoute('/analyst/:name');
  const [, navigate] = useLocation();
  const [timeRange, setTimeRange] = useState<TimeRange>('year');

  const analystName = params?.name ? decodeURIComponent(params.name) : '';

  // 獲取分析師數據
  const analystRecords = useMemo(() => {
    const records = (allData as any)[analystName] || [];
    return records.sort((a: any, b: any) => a.日期.localeCompare(b.日期));
  }, [analystName]);

  // 計算時間範圍
  const getDateRange = () => {
    const today = new Date('2026-06-23');
    let startDate = new Date(today);

    switch (timeRange) {
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'three_months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'one_month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'one_week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        break;
    }

    return startDate;
  };

  // 過濾數據
  const filteredData = useMemo(() => {
    const startDate = getDateRange();
    return analystRecords.filter((record: any) => {
      const recordDate = new Date(
        parseInt(record.日期.substring(0, 4)),
        parseInt(record.日期.substring(4, 6)) - 1,
        parseInt(record.日期.substring(6, 8))
      );
      return recordDate >= startDate;
    });
  }, [analystRecords, timeRange]);

  // 準備圖表數據
  const chartData = useMemo(() => {
    return filteredData.map((record: any) => ({
      date: record.日期,
      friends: parseInt(record.累積好友數.toString().replace(/,/g, '')),
      added: parseInt((record.昨日增加人數 || '0').toString().replace(/,/g, '')),
      blocked: parseInt((record.昨日封鎖人數 || '0').toString().replace(/,/g, '')),
    }));
  }, [filteredData]);

  if (!analystName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">分析師未找到</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{analystName}</h1>
            <p className="text-sm text-slate-600">數據趨勢分析</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Time Range Selector */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            onClick={() => setTimeRange('year')}
            variant={timeRange === 'year' ? 'default' : 'outline'}
            className={`font-semibold ${
              timeRange === 'year'
                ? 'bg-blue-600 text-white'
                : 'border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            今年
          </Button>
          <Button
            onClick={() => setTimeRange('three_months')}
            variant={timeRange === 'three_months' ? 'default' : 'outline'}
            className={`font-semibold ${
              timeRange === 'three_months'
                ? 'bg-blue-600 text-white'
                : 'border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            近三月
          </Button>
          <Button
            onClick={() => setTimeRange('one_month')}
            variant={timeRange === 'one_month' ? 'default' : 'outline'}
            className={`font-semibold ${
              timeRange === 'one_month'
                ? 'bg-blue-600 text-white'
                : 'border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            近一月
          </Button>
          <Button
            onClick={() => setTimeRange('one_week')}
            variant={timeRange === 'one_week' ? 'default' : 'outline'}
            className={`font-semibold ${
              timeRange === 'one_week'
                ? 'bg-blue-600 text-white'
                : 'border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            上周
          </Button>
          <Button
            onClick={() => setTimeRange('yesterday')}
            variant={timeRange === 'yesterday' ? 'default' : 'outline'}
            className={`font-semibold ${
              timeRange === 'yesterday'
                ? 'bg-blue-600 text-white'
                : 'border-blue-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            昨日
          </Button>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          {/* 累積好友數趨勢 */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">累積好友數趨勢</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="friends"
                  stroke="#1e40af"
                  strokeWidth={2}
                  dot={false}
                  name="累積好友數"
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 每日新增與封鎖趨勢 */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">每日新增與封鎖趨勢</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="added"
                  stroke="#0891b2"
                  strokeWidth={2}
                  dot={false}
                  name="新增人數"
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="blocked"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={false}
                  name="封鎖人數"
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
