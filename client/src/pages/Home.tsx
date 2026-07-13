'use client';

import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import analystsByDateData from '@/data/analysts_by_date.json';

type TimeFrame = 'week' | 'month' | 'year';

export default function Home() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  
  // Get all dates from the data
  const allDates = Object.keys(analystsByDateData).sort((a, b) => {
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();
    return dateB - dateA;
  });
  
  const latestDate = allDates[0];
  const [selectedDate, setSelectedDate] = useState<string>(latestDate);

  const daihuaAnalysts = ['阮蕙慈', '洪士哲', '張志誠', '林睿閎', '羅文彬', '顏至恆', '丁兆宇', '劉艾綸'];
  const dalaiAnalysts = ['葉子暘', '陳彥蓉', '蔡宗園', '蔡正華', '謝逸文', '周弘', '蘇麗芬', '張立旻'];

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const calculateMetrics = (analystName: string, baseDate: string) => {
    const baseDateData = (analystsByDateData as any)[baseDate];
    if (!baseDateData) return { growth: 0, blockRate: 0 };

    const allAnalysts = [...baseDateData.large, ...baseDateData.small];
    const baseAnalystData = allAnalysts.find((a: any) => a.name === analystName);
    
    if (!baseAnalystData) return { growth: 0, blockRate: 0 };

    let startDate: string | null = null;
    const baseDateObj = new Date(baseDate);

    if (timeFrame === 'week') {
      const startDateObj = new Date(baseDateObj);
      startDateObj.setDate(startDateObj.getDate() - 7);
      const startDateStr = startDateObj.toLocaleDateString('zh-TW').replace(/\//g, '/');
      // Find the closest date in allDates
      startDate = allDates.reduce((closest: string, current: string) => {
        const closestDate = new Date(closest);
        const currentDate = new Date(current);
        return Math.abs(currentDate.getTime() - startDateObj.getTime()) < Math.abs(closestDate.getTime() - startDateObj.getTime()) ? current : closest;
      });
    } else if (timeFrame === 'month') {
      const startDateObj = new Date(baseDateObj);
      startDateObj.setDate(startDateObj.getDate() - 30);
      startDate = allDates.reduce((closest: string, current: string) => {
        const closestDate = new Date(closest);
        const currentDate = new Date(current);
        return Math.abs(currentDate.getTime() - startDateObj.getTime()) < Math.abs(closestDate.getTime() - startDateObj.getTime()) ? current : closest;
      });
    } else {
      const year = parseInt(baseDate.substring(0, 4));
      const startDateObj = new Date(`${year}/01/01`);
      startDate = allDates.reduce((closest: string, current: string) => {
        const closestDate = new Date(closest);
        const currentDate = new Date(current);
        return Math.abs(currentDate.getTime() - startDateObj.getTime()) < Math.abs(closestDate.getTime() - startDateObj.getTime()) ? current : closest;
      });
    }

    const startDateData = (analystsByDateData as any)[startDate];
    if (!startDateData) return { growth: baseAnalystData.daily_new, blockRate: baseAnalystData.block_rate };

    const startAnalystData = [...startDateData.large, ...startDateData.small].find((a: any) => a.name === analystName);
    if (!startAnalystData) return { growth: baseAnalystData.daily_new, blockRate: baseAnalystData.block_rate };

    const growth = baseAnalystData.cumulative_friends - startAnalystData.cumulative_friends;
    
    // 計算該時期所有日期的平均封鎖率
    const startDateIndex = allDates.indexOf(startDate);
    const baseDateIndex = allDates.indexOf(baseDate);
    const datesInRange = allDates.slice(Math.min(startDateIndex, baseDateIndex), Math.max(startDateIndex, baseDateIndex) + 1);
    
    let totalBlockRate = 0;
    let count = 0;
    
    datesInRange.forEach((date: string) => {
      const dateData = (analystsByDateData as any)[date];
      if (dateData) {
        const analystData = [...dateData.large, ...dateData.small].find((a: any) => a.name === analystName);
        if (analystData) {
          totalBlockRate += analystData.block_rate;
          count++;
        }
      }
    });
    
    const blockRate = count > 0 ? totalBlockRate / count : baseAnalystData.block_rate;

    return { growth, blockRate };
  };

  const selectedDateFormatted = formatDate(selectedDate);
  const selectedDateData = (analystsByDateData as any)[selectedDate];

  if (!selectedDateData) {
    return <div className="p-4">無法讀取數據</div>;
  }

  const daihuaYT = selectedDateData.large.find((a: any) => a.name === '大華YT') || { cumulative_friends: 0, block_rate: 0 };
  const dalaiYT = selectedDateData.small.find((a: any) => a.name === '大來YT') || { cumulative_friends: 0, block_rate: 0 };

  const daihuaAnalystsData = selectedDateData.large.filter((a: any) => daihuaAnalysts.includes(a.name));
  const dalaiAnalystsData = selectedDateData.small.filter((a: any) => dalaiAnalysts.includes(a.name));

  const daihuaAvgBlockRate = daihuaAnalystsData.length > 0 
    ? daihuaAnalystsData.reduce((sum: number, a: any) => sum + a.block_rate, 0) / daihuaAnalystsData.length 
    : 0;
  const dalaiAvgBlockRate = dalaiAnalystsData.length > 0 
    ? dalaiAnalystsData.reduce((sum: number, a: any) => sum + a.block_rate, 0) / dalaiAnalystsData.length 
    : 0;

  const getBlockRateColor = (blockRate: number): string => {
    if (blockRate >= 0.4) return 'bg-green-100';
    if (blockRate >= 0.2) return 'bg-blue-100';
    if (blockRate >= 0.1) return 'bg-red-100';
    return 'bg-yellow-100';
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      <h1 className="text-lg font-bold mb-2">分析師封鎖統計</h1>
      <p className="text-xs text-gray-600 mb-4">LINE/YT 粉絲動態追蹤</p>

      <div className="mb-4 flex gap-2 items-center">
        <label className="text-sm">選擇日期:</label>
        <input
          type="date"
          value={selectedDate.replace(/\//g, '-')}
          onChange={(e) => {
            const dateStr = e.target.value.replace(/-/g, '/');
            setSelectedDate(dateStr);
          }}
          max={latestDate.replace(/\//g, '-')}
          className="border rounded px-2 py-1 text-sm"
        />
        <span className="text-sm text-gray-600">{selectedDateFormatted}</span>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          onClick={() => setTimeFrame('week')}
          variant={timeFrame === 'week' ? 'default' : 'outline'}
          className="text-sm"
        >
          本周增長
        </Button>
        <Button
          onClick={() => setTimeFrame('month')}
          variant={timeFrame === 'month' ? 'default' : 'outline'}
          className="text-sm"
        >
          本月增長
        </Button>
        <Button
          onClick={() => setTimeFrame('year')}
          variant={timeFrame === 'year' ? 'default' : 'outline'}
          className="text-sm"
        >
          今年增長
        </Button>
      </div>

      <table className="w-full border-collapse text-sm mb-4">
        <tbody>
          <tr className="bg-blue-50">
            <td className="border p-1 text-center font-bold">大華國際投顧</td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
          </tr>
          <tr className="bg-blue-100">
            <th className="border p-1 text-center">分析師</th>
            <th className="border p-1 text-center">{selectedDateFormatted}</th>
            <th className="border p-1 text-center">
              {timeFrame === 'week' ? '本周增長' : timeFrame === 'month' ? '本月增長' : '今年增長'}
            </th>
            <th className="border p-1 text-center">
              {timeFrame === 'week' ? '本周增長封鎖率' : timeFrame === 'month' ? '本月增長封鎖率' : '今年增長封鎖率'}
            </th>
          </tr>
          {daihuaAnalystsData.map((analyst: any) => {
            const metrics = calculateMetrics(analyst.name, selectedDate);
            return (
              <tr key={analyst.name}>
                <td className="border p-1 text-center">
                  <Link href={`/analyst/${analyst.name}`} className="text-blue-600 hover:underline">
                    {analyst.name}
                  </Link>
                </td>
                <td className="border p-1 text-center">{analyst.cumulative_friends}</td>
                <td className="border p-1 text-center">{metrics.growth}</td>
                <td className={`border p-1 text-center ${getBlockRateColor(metrics.blockRate / 100)}`}>
                  {metrics.blockRate.toFixed(2)}%
                </td>
              </tr>
            );
          })}
          <tr className="bg-blue-50">
            <td className="border p-1 text-center font-bold">大來國際投顧</td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
            <td className="border p-1 text-center"></td>
          </tr>
          <tr className="bg-blue-100">
            <th className="border p-1 text-center">分析師</th>
            <th className="border p-1 text-center">{selectedDateFormatted}</th>
            <th className="border p-1 text-center">
              {timeFrame === 'week' ? '本周增長' : timeFrame === 'month' ? '本月增長' : '今年增長'}
            </th>
            <th className="border p-1 text-center">
              {timeFrame === 'week' ? '本周增長封鎖率' : timeFrame === 'month' ? '本月增長封鎖率' : '今年增長封鎖率'}
            </th>
          </tr>
          {dalaiAnalystsData.map((analyst: any) => {
            const metrics = calculateMetrics(analyst.name, selectedDate);
            return (
              <tr key={analyst.name}>
                <td className="border p-1 text-center">
                  <Link href={`/analyst/${analyst.name}`} className="text-blue-600 hover:underline">
                    {analyst.name}
                  </Link>
                </td>
                <td className="border p-1 text-center">{analyst.cumulative_friends}</td>
                <td className="border p-1 text-center">{metrics.growth}</td>
                <td className={`border p-1 text-center ${getBlockRateColor(metrics.blockRate / 100)}`}>
                  {metrics.blockRate.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 text-xs text-gray-600">
        平均 {timeFrame === 'week' ? '本周增長' : timeFrame === 'month' ? '本月增長' : '今年增長'}: 
        {Math.round(
          (daihuaAnalystsData.reduce((sum: number, a: any) => sum + calculateMetrics(a.name, selectedDate).growth, 0) +
            dalaiAnalystsData.reduce((sum: number, a: any) => sum + calculateMetrics(a.name, selectedDate).growth, 0)) /
          (daihuaAnalystsData.length + dalaiAnalystsData.length || 1)
        )} | 
        平均封鎖率: {((daihuaAvgBlockRate + dalaiAvgBlockRate) / 2).toFixed(2)}%
      </div>
    </div>
  );
}
