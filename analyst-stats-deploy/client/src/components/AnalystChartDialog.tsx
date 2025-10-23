import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalystData {
  date: string;
  totalFriends: number;
  yesterdayAdded: number;
  yesterdayBlocked: number;
}

interface AnalystChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analystName: string;
  data: AnalystData[];
}

export default function AnalystChartDialog({ open, onOpenChange, analystName, data }: AnalystChartDialogProps) {
  // 格式化日期顯示
  const formatDate = (dateStr: string) => {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${month}/${day}`;
  };

  // 準備圖表資料
  const chartData = data.map(item => ({
    date: formatDate(item.date),
    fullDate: `${item.date.substring(0, 4)}/${item.date.substring(4, 6)}/${item.date.substring(6, 8)}`,
    累積好友數: item.totalFriends,
    每日新增: item.yesterdayAdded,
    每日封鎖: item.yesterdayBlocked
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {analystName} - 2025年數據趨勢
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* 累積好友數趨勢 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">累積好友數趨勢</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(chartData.length / 10)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `日期: ${payload[0].payload.fullDate}`;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="累積好友數" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 每日新增與封鎖趨勢 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">每日新增與封鎖趨勢</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(chartData.length / 10)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `日期: ${payload[0].payload.fullDate}`;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="每日新增" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="每日封鎖" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

