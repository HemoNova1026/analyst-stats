import csv
import io
import json
import os
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import requests

CSV_URL = os.environ.get(
    "GOOGLE_SHEET_CSV_URL",
    "https://docs.google.com/spreadsheets/d/12g0ikHklbVfCc4jdes5YQdcxyjFzTFGaeLTyIvpdvMg/export?format=csv&gid=1581904899",
)

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "client" / "src" / "data"
ANALYSTS_BY_DATE_PATH = DATA_DIR / "analysts_by_date.json"
ALL_DATA_PATH = DATA_DIR / "all_data.json"

DAIHUA = ["阮蕙慈", "洪士哲", "張志誠", "林睿閎", "羅文彬", "顏至恆", "丁兆宇", "劉艾綸"]
DALAI = ["葉子暘", "陳彥蓉", "蔡宗園", "蔡正華", "謝逸文", "周弘", "蘇麗芬", "張立旻"]

REQUIRED_COLUMNS = {
    "分析師",
    "日期",
    "累積好友數",
    "可觸及人數",
    "封鎖數",
    "封鎖率",
    "昨日增加人數",
    "昨日封鎖人數",
}


def clean(value):
    return str(value or "").strip()


def parse_int(value):
    text = clean(value).replace(",", "")
    if not text:
        return 0
    try:
        return int(float(text))
    except ValueError:
        return 0


def parse_rate(value):
    text = clean(value).replace("%", "")
    if not text:
        return 0.0

    try:
        number = float(text)
    except ValueError:
        return 0.0

    # Google Sheet 可能輸出 0.1877，也可能輸出 18.77%
    if number <= 1:
        number *= 100

    return round(number, 2)


def normalize_date(value):
    text = clean(value)

    if not text:
        return ""

    digits = re.sub(r"\D", "", text)

    if len(digits) == 8:
        year, month, day = digits[:4], digits[4:6], digits[6:8]
    else:
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d"):
            try:
                dt = datetime.strptime(text, fmt)
                return dt.strftime("%Y/%m/%d")
            except ValueError:
                pass
        return ""

    try:
        dt = datetime(int(year), int(month), int(day))
        return dt.strftime("%Y/%m/%d")
    except ValueError:
        return ""


def download_rows():
    response = requests.get(CSV_URL, timeout=60)
    response.raise_for_status()

    text = response.content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        raise RuntimeError("CSV 沒有標題列。")

    fieldnames = {clean(name) for name in reader.fieldnames}
    missing = REQUIRED_COLUMNS - fieldnames

    if missing:
        raise RuntimeError(
            "CSV 缺少必要欄位：" + "、".join(sorted(missing))
        )

    rows = []

    for raw in reader:
        row = {clean(k): clean(v) for k, v in raw.items() if k is not None}
        name = row.get("分析師", "")
        date = normalize_date(row.get("日期", ""))

        if not name or not date:
            continue

        row["日期"] = date.replace("/", "")
        rows.append(row)

    if not rows:
        raise RuntimeError(
            "CSV 沒有可用資料。請確認 Google Sheet 已公開，且 gid 指向 AllData 分頁。"
        )

    return rows


def build_outputs(rows):
    all_data = defaultdict(list)
    analysts_by_date = defaultdict(lambda: {"large": [], "small": []})

    # 同一位分析師同一天若重複，保留最後一筆
    dedup = {}

    for row in rows:
        key = (row["分析師"], row["日期"])
        dedup[key] = row

    sorted_rows = sorted(
        dedup.values(),
        key=lambda r: (r["日期"], r["分析師"]),
    )

    for row in sorted_rows:
        name = row["分析師"]
        yyyymmdd = row["日期"]
        display_date = datetime.strptime(yyyymmdd, "%Y%m%d").strftime("%Y/%m/%d")

        normalized_row = {
            "分析師": name,
            "日期": yyyymmdd,
            "累積好友數": str(parse_int(row.get("累積好友數"))),
            "可觸及人數": str(parse_int(row.get("可觸及人數"))),
            "封鎖數": str(parse_int(row.get("封鎖數"))),
            "封鎖率": f"{parse_rate(row.get('封鎖率')):.2f}%",
            "昨日增加人數": str(parse_int(row.get("昨日增加人數"))),
            "昨日封鎖人數": str(parse_int(row.get("昨日封鎖人數"))),
        }

        all_data[name].append(normalized_row)

        card = {
            "name": name,
            "cumulative_friends": parse_int(row.get("累積好友數")),
            "daily_new": parse_int(row.get("昨日增加人數")),
            "block_count": parse_int(row.get("封鎖數")),
            "block_rate": parse_rate(row.get("封鎖率")),
        }

        if name in DAIHUA:
            analysts_by_date[display_date]["large"].append(card)
        elif name in DALAI:
            analysts_by_date[display_date]["small"].append(card)

    # 固定顯示順序
    daihua_order = {name: index for index, name in enumerate(DAIHUA)}
    dalai_order = {name: index for index, name in enumerate(DALAI)}

    for date_data in analysts_by_date.values():
        date_data["large"].sort(
            key=lambda item: daihua_order.get(item["name"], 999)
        )
        date_data["small"].sort(
            key=lambda item: dalai_order.get(item["name"], 999)
        )

    return dict(analysts_by_date), dict(all_data)


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    rows = download_rows()
    analysts_by_date, all_data = build_outputs(rows)

    ANALYSTS_BY_DATE_PATH.write_text(
        json.dumps(
            analysts_by_date,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        ),
        encoding="utf-8",
    )

    ALL_DATA_PATH.write_text(
        json.dumps(
            all_data,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    latest_date = max(analysts_by_date.keys())

    print(f"CSV rows: {len(rows)}")
    print(f"Latest date: {latest_date}")
    print(f"Updated: {ANALYSTS_BY_DATE_PATH}")
    print(f"Updated: {ALL_DATA_PATH}")


if __name__ == "__main__":
    main()
