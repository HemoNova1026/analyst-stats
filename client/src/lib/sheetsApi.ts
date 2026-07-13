// Google Sheets API 配置
const SHEET_ID = '12g0ikHklbVfCc4jdes5YQdcxyjFzTFGaeLTyIvpdvMg';
const SHEET_NAME = 'AllData';

// 從 Google Sheets 讀取數據 - 使用 CORS 代理
export async function fetchAnalystData() {
  try {
    // 使用 CORS 代理服務
    const url = `https://cors-anywhere.herokuapp.com/https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
    
    let response = await fetch(url).catch(() => null);
    
    // 如果 CORS 代理失敗，嘗試直接 fetch
    if (!response) {
      const directUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
      response = await fetch(directUrl, {
        mode: 'no-cors'
      });
    }
    
    if (!response || !response.ok) throw new Error('Failed to fetch data');
    
    const csv = await response.text();
    const lines = csv.trim().split('\n');
    
    if (lines.length < 2) throw new Error('No data found');
    
    // 解析 CSV 標題
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // 解析數據行
    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      data.push(row);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    // 回退到使用本地 JSON 數據
    try {
      const response = await fetch('/data/analysts_by_date.json');
      if (response.ok) {
        const jsonData = await response.json();
        // 將 JSON 格式轉換為 CSV 格式
        return convertJsonToCsv(jsonData);
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    throw error;
  }
}

// 將 JSON 數據轉換為 CSV 格式
function convertJsonToCsv(jsonData: any) {
  const data: any[] = [];
  
  for (const date of jsonData.dates) {
    const dateData = jsonData.analysts_by_date[date] || {};
    for (const analyst in dateData) {
      const record = dateData[analyst];
      data.push({
        '分析師': analyst,
        '日期': date,
        '累積好友數': record.friends,
        '可觸及人數': 0,
        '封鎖數': 0,
        '封鎖率': record.blockRate,
        '昨日增加人數': record.dailyNew,
        '昨日封鎖人數': record.dailyBlock,
      });
    }
  }
  
  return data;
}

// 處理數據並按分析師分組
export function processAnalystData(rawData: any[]) {
  const daihuaAnalysts = ['阮蕙慈', '洪士哲', '張志誠', '林睿閎', '顏至恆', '羅文彬', '丁兆宇', '劉艾綸'];
  const dalaiAnalysts = ['葉子暘', '陳彥蓉', '蔡宗園', '蔡正華', '謝逸文', '周弘', '余正君', '張立旻', '蘇麗芬', '蘇建豐'];
  
  const analystsByDate: { [key: string]: { [key: string]: any } } = {};
  const dates = new Set<string>();
  
  rawData.forEach(row => {
    const date = row['日期'];
    const analyst = row['分析師'];
    
    if (!date || !analyst) return;
    
    dates.add(date);
    
    if (!analystsByDate[date]) {
      analystsByDate[date] = {};
    }
    
    // 解析封鎖率（移除 % 符號）
    let blockRate = 0;
    if (typeof row['封鎖率'] === 'string') {
      blockRate = parseFloat(row['封鎖率'].replace('%', '')) || 0;
    } else {
      blockRate = parseFloat(row['封鎖率']) || 0;
    }
    
    analystsByDate[date][analyst] = {
      friends: parseInt(row['累積好友數']) || 0,
      blockRate: blockRate,
      dailyNew: parseInt(row['昨日增加人數']) || 0,
      dailyBlock: parseInt(row['昨日封鎖人數']) || 0,
    };
  });
  
  const sortedDates = Array.from(dates).sort();
  
  return {
    dates: sortedDates,
    daihua_analysts: daihuaAnalysts,
    dalai_analysts: dalaiAnalysts,
    analysts_by_date: analystsByDate,
  };
}
