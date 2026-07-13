import csv
from datetime import datetime, timedelta
from collections import defaultdict
import json

# 讀取原始 CSV
analysts_data = defaultdict(list)
with open('/home/ubuntu/analyst_data.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        analyst = row['分析師']
        analysts_data[analyst].append(row)

# 分類信息
categories = {
    '大華國際投顧': ['阮蕙慈', '洪士哲', '張志誠', '林睿閎', '顏至恆', '羅文彬'],
    '大來國際投顧': ['葉子暘', '陳彥蓉', '蔡宗園', '蔡正華', '謝逸文', '周弘', '丁兆宇', '余正君', '劉艾綸', '張立旻', '蘇麗芬', '蘇建豐']
}

def parse_number(s):
    """解析數字，移除逗號"""
    if not s:
        return 0
    return int(s.replace(',', ''))

# 計算增長數據
def calculate_growth(analyst_records, target_date_str, days_back):
    """計算指定天數內的增長"""
    target_date = datetime.strptime(target_date_str, '%Y%m%d')
    start_date = target_date - timedelta(days=days_back)
    
    # 找到目標日期的記錄
    target_record = None
    start_record = None
    
    for record in analyst_records:
        record_date = datetime.strptime(record['日期'], '%Y%m%d')
        if record_date == target_date:
            target_record = record
        if record_date == start_date:
            start_record = record
    
    if target_record and start_record:
        target_friends = parse_number(target_record['累積好友數'])
        start_friends = parse_number(start_record['累積好友數'])
        return target_friends - start_friends
    elif target_record and not start_record:
        # 如果沒有開始日期，返回累積好友數
        return parse_number(target_record['累積好友數'])
    return 0

# 生成最新日期的數據
latest_date = '20260624'

output_data = {}
for category, analysts in categories.items():
    output_data[category] = []
    for analyst in analysts:
        if analyst in analysts_data:
            records = analysts_data[analyst]
            # 找到最新日期的記錄
            latest_record = None
            for record in records:
                if record['日期'] == latest_date:
                    latest_record = record
                    break
            
            if latest_record:
                # 計算不同時間段的增長
                week_growth = calculate_growth(records, latest_date, 7)
                month_growth = calculate_growth(records, latest_date, 30)
                year_growth = calculate_growth(records, latest_date, 365)
                
                analyst_info = {
                    'name': analyst,
                    'date': latest_date,
                    'friends': parse_number(latest_record['累積好友數']),
                    'reachable': parse_number(latest_record['可觸及人數']),
                    'blocked': parse_number(latest_record['封鎖數']),
                    'block_rate': latest_record['封鎖率'],
                    'week_growth': week_growth,
                    'month_growth': month_growth,
                    'year_growth': year_growth,
                    'yesterday_added': parse_number(latest_record['昨日增加人數']),
                    'yesterday_blocked': parse_number(latest_record['昨日封鎖人數']),
                }
                output_data[category].append(analyst_info)

# 保存為 JSON
with open('/home/ubuntu/analyst-stats/client/src/data/analysts.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print("✓ 數據生成完成")
print(f"大華國際投顧: {len(output_data['大華國際投顧'])} 位分析師")
print(f"大來國際投顧: {len(output_data['大來國際投顧'])} 位分析師")

# 保存完整數據供詳細頁使用
all_data_dict = {}
for analyst, records in analysts_data.items():
    all_data_dict[analyst] = records

with open('/home/ubuntu/analyst-stats/client/src/data/all_data.json', 'w', encoding='utf-8') as f:
    json.dump(all_data_dict, f, ensure_ascii=False, indent=2)

print("✓ 完整數據已保存")
