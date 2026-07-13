export async function fetchSheetsData() {
  try {
    // 使用多個 CORS 代理嘗試
    const proxies = [
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
    ];

    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBshk6G2cVXteIp9tuA_Fgdpb1LqR6futGlI2luo_Z0bKj2W6u42iTJbkhC0GB-x77pXrLom_ifu5Y/pub?output=csv';

    for (const proxy of proxies) {
      try {
        const fullUrl = proxy.includes('?') ? `${proxy}${encodeURIComponent(sheetUrl)}` : `${proxy}${sheetUrl}`;
        const response = await fetch(fullUrl, {
          headers: {
            'Accept': 'text/csv',
          },
        });

        if (response.ok) {
          const csv = await response.text();
          return parseCSV(csv);
        }
      } catch (err) {
        console.log(`Proxy ${proxy} failed, trying next...`);
        continue;
      }
    }

    // 如果所有代理都失敗，嘗試直接請求
    const response = await fetch(sheetUrl);
    if (response.ok) {
      const csv = await response.text();
      return parseCSV(csv);
    }

    throw new Error('All CORS proxies failed');
  } catch (error) {
    console.error('Error fetching sheets data:', error);
    throw error;
  }
}

export function parseCSV(csv: string) {
  const lines = csv.split('\n').filter(line => line.trim());
  const data: { [date: string]: { [analyst: string]: { friends: number; blockRate: number } } } = {};
  const uniqueDates = new Set<string>();
  const daihuaSet = new Set<string>();
  const dalaiSet = new Set<string>();

  // 跳過標題行
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 6) continue;

    const analyst = parts[0].trim();
    const dateStr = parts[1].trim();
    const friendsStr = parts[2].trim().replace(/,/g, '');
    const blockRateStr = parts[5].trim();

    if (!analyst || !dateStr) continue;

    // 轉換日期格式 (2026/6/21 -> 20260621)
    const [year, month, day] = dateStr.split('/');
    const dateNum = `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;

    const friends = parseInt(friendsStr) || 0;
    const blockRate = parseFloat(blockRateStr) || 0;

    uniqueDates.add(dateNum);

    if (!data[dateNum]) {
      data[dateNum] = {};
    }

    data[dateNum][analyst] = { friends, blockRate };

    // 分類分析師
    if (!analyst.includes('YT')) {
      if (
        analyst === '丁兆宇' ||
        analyst === '劉艾綸' ||
        analyst === '阮蕙慈' ||
        analyst === '洪士哲' ||
        analyst === '張志誠' ||
        analyst === '林睿閎' ||
        analyst === '顏至恆' ||
        analyst === '羅文彬'
      ) {
        daihuaSet.add(analyst);
      } else if (analyst) {
        dalaiSet.add(analyst);
      }
    }
  }

  const sortedDates = Array.from(uniqueDates).sort();

  return {
    data,
    dates: sortedDates,
    daihuaAnalysts: Array.from(daihuaSet).sort(),
    dalaiAnalysts: Array.from(dalaiSet).sort(),
  };
}
