"""
ProHouzing — Seed 700 Nhân sự + Dữ liệu Tài chính 3 năm
==========================================================
Chạy: python backend/seed_700_employees.py

Dữ liệu:
  - 700 nhân sự đầy đủ chức danh, phòng ban, chi nhánh
  - 5 tỉnh: HCM, Hà Nội, Đà Nẵng, Khánh Hoà, Hải Phòng
  - Dữ liệu tài chính 2022–2024 (Doanh thu / Chi phí / Lợi nhuận)
  - Tất cả đều CÓ THỂ xoá / chỉnh sửa qua API
"""

import asyncio
import os
import uuid
import random
from datetime import datetime, date, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# ── Config ────────────────────────────────────────────────────────────────────
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.environ.get("DB_NAME",   "prohouzing_db")

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def uid():
    return str(uuid.uuid4())

def rand_date(start_year=2018, end_year=2024):
    start = date(start_year, 1, 1)
    end   = date(end_year,   12, 31)
    delta = (end - start).days
    return (start + timedelta(days=random.randint(0, delta))).isoformat()

def rand_phone():
    prefixes = ["090", "091", "093", "094", "096", "097", "098", "070", "079", "077", "076"]
    return random.choice(prefixes) + "".join([str(random.randint(0,9)) for _ in range(7)])

# ── Org Structure ─────────────────────────────────────────────────────────────
CITIES = [
    {"code": "HCM", "name": "Hồ Chí Minh", "address": "Tầng 15, Landmark 81, Q. Bình Thạnh, TP.HCM", "quota": 300},
    {"code": "HN",  "name": "Hà Nội",       "address": "Tầng 8, Keangnam Hanoi, Nam Từ Liêm, Hà Nội", "quota": 180},
    {"code": "DN",  "name": "Đà Nẵng",      "address": "30 Bạch Đằng, Hải Châu, Đà Nẵng",             "quota": 80},
    {"code": "KH",  "name": "Khánh Hoà",    "address": "12 Trần Phú, Nha Trang, Khánh Hoà",           "quota": 70},
    {"code": "HP",  "name": "Hải Phòng",    "address": "15 Đinh Tiên Hoàng, Hồng Bàng, Hải Phòng",   "quota": 70},
]

DEPARTMENTS = [
    {"code": "BGD",  "name": "Ban Giám đốc",                "city_pct": 0.02},
    {"code": "KD",   "name": "Kinh doanh & Bán hàng",       "city_pct": 0.40},
    {"code": "MKT",  "name": "Marketing & Thương hiệu",     "city_pct": 0.09},
    {"code": "TC",   "name": "Tài chính & Kế toán",         "city_pct": 0.07},
    {"code": "NS",   "name": "Nhân sự & Đào tạo",           "city_pct": 0.05},
    {"code": "PL",   "name": "Pháp lý & Tuân thủ",          "city_pct": 0.04},
    {"code": "VH",   "name": "Vận hành & Hành chính",       "city_pct": 0.08},
    {"code": "IT",   "name": "Công nghệ thông tin",         "city_pct": 0.05},
    {"code": "CSKH", "name": "Chăm sóc Khách hàng",         "city_pct": 0.06},
    {"code": "DA",   "name": "Phát triển Dự án",            "city_pct": 0.07},
    {"code": "QHDT", "name": "Quan hệ Đối tác & Đầu tư",   "city_pct": 0.03},
    {"code": "KT",   "name": "Kiểm toán Nội bộ",            "city_pct": 0.02},
    {"code": "TT",   "name": "Truyền thông & PR",           "city_pct": 0.02},
]

# Job titles per department (title, level 1-5, salary_range)
POSITIONS = {
    "BGD": [
        ("Tổng Giám Đốc (CEO)",           5, (200e6, 300e6)),
        ("Phó Tổng Giám Đốc Vận hành",   5, (150e6, 200e6)),
        ("Phó Tổng Giám Đốc Kinh doanh", 5, (150e6, 200e6)),
        ("Giám Đốc Điều Hành (COO)",      5, (120e6, 180e6)),
        ("Giám Đốc Tài chính (CFO)",      5, (120e6, 180e6)),
        ("Giám Đốc Marketing (CMO)",      5, (100e6, 150e6)),
        ("Giám Đốc CN Hồ Chí Minh",      4, (80e6,  120e6)),
        ("Giám Đốc CN Hà Nội",           4, (80e6,  120e6)),
        ("Giám Đốc CN Đà Nẵng",          4, (60e6,  90e6)),
        ("Giám Đốc CN Khánh Hoà",        4, (60e6,  90e6)),
        ("Giám Đốc CN Hải Phòng",        4, (60e6,  90e6)),
        ("Trợ Lý Tổng Giám Đốc",         3, (25e6,  40e6)),
        ("Thư Ký Điều Hành",             2, (15e6,  25e6)),
    ],
    "KD": [
        ("Giám Đốc Kinh Doanh",          4, (80e6,  120e6)),
        ("Trưởng Phòng Kinh Doanh",      4, (50e6,  80e6)),
        ("Trưởng Nhóm Kinh Doanh",       3, (30e6,  50e6)),
        ("Chuyên Viên Kinh Doanh Cao Cấp",3,(25e6,  40e6)),
        ("Chuyên Viên Kinh Doanh",       2, (15e6,  30e6)),
        ("Nhân Viên Kinh Doanh",         1, (10e6,  20e6)),
        ("Sales Executive",              2, (15e6,  28e6)),
        ("Broker Bất Động Sản",          2, (12e6,  25e6)),
        ("Cộng Tác Viên Kinh Doanh",     1, (8e6,   15e6)),
    ],
    "MKT": [
        ("Giám Đốc Marketing",           4, (80e6,  120e6)),
        ("Trưởng Phòng Marketing",       4, (45e6,  70e6)),
        ("Chuyên Viên Digital Marketing",3, (20e6,  35e6)),
        ("Chuyên Viên Content",          2, (15e6,  28e6)),
        ("Chuyên Viên SEO/SEM",          2, (15e6,  28e6)),
        ("Nhân Viên Thiết Kế",           2, (12e6,  22e6)),
        ("Nhân Viên Truyền Thông MXH",  2, (12e6,  20e6)),
        ("Chuyên Viên Sự Kiện",          2, (15e6,  25e6)),
        ("Điều Phối Marketing",          1, (10e6,  18e6)),
    ],
    "TC": [
        ("Giám Đốc Tài Chính",          4, (100e6, 150e6)),
        ("Kế Toán Trưởng",              4, (50e6,  80e6)),
        ("Chuyên Viên Phân Tích Tài Chính",3,(25e6, 45e6)),
        ("Kế Toán Tổng Hợp",            3, (20e6,  35e6)),
        ("Kế Toán Công Nợ",             2, (15e6,  28e6)),
        ("Kế Toán Lương",               2, (15e6,  28e6)),
        ("Kế Toán Thuế",                2, (15e6,  28e6)),
        ("Ngân Quỹ",                    2, (15e6,  25e6)),
        ("Nhân Viên Kế Toán",           1, (10e6,  18e6)),
    ],
    "NS": [
        ("Giám Đốc Nhân Sự (CHRO)",     4, (90e6,  130e6)),
        ("Trưởng Phòng Tuyển Dụng",     3, (40e6,  65e6)),
        ("Chuyên Viên Tuyển Dụng",      2, (18e6,  32e6)),
        ("Chuyên Viên Đào Tạo & Phát Triển",2,(18e6,32e6)),
        ("Chuyên Viên C&B",             2, (18e6,  32e6)),
        ("Chuyên Viên Văn Hoá Doanh Nghiệp",2,(15e6,28e6)),
        ("Nhân Viên Hành Chính NS",     1, (10e6,  18e6)),
    ],
    "PL": [
        ("Giám Đốc Pháp Lý",            4, (90e6,  140e6)),
        ("Luật Sư Nội Bộ (Senior)",     3, (50e6,  85e6)),
        ("Chuyên Viên Pháp Lý BĐS",    3, (30e6,  55e6)),
        ("Chuyên Viên Tuân Thủ",        2, (25e6,  42e6)),
        ("Nhân Viên Pháp Lý",           2, (18e6,  32e6)),
    ],
    "VH": [
        ("Giám Đốc Vận Hành",           4, (80e6,  120e6)),
        ("Trưởng Phòng Hành Chính",     3, (35e6,  55e6)),
        ("Chuyên Viên Quản Lý Tài Sản", 2, (18e6,  32e6)),
        ("Nhân Viên Hành Chính",        1, (10e6,  18e6)),
        ("Lễ Tân",                      1, (9e6,   15e6)),
        ("Bảo Vệ",                      1, (7e6,   12e6)),
        ("Tạp Vụ",                      1, (6e6,   10e6)),
    ],
    "IT": [
        ("Giám Đốc Công Nghệ (CTO)",    4, (120e6, 180e6)),
        ("Kiến Trúc Sư Hệ Thống",       4, (60e6,  100e6)),
        ("Lập Trình Viên Senior",       3, (35e6,  65e6)),
        ("Lập Trình Viên",              2, (20e6,  40e6)),
        ("Kỹ Sư QA",                    2, (18e6,  35e6)),
        ("DevOps Engineer",             3, (35e6,  65e6)),
        ("Chuyên Viên Bảo Mật",         3, (35e6,  60e6)),
        ("Hỗ Trợ Kỹ Thuật (IT Support)",1,(12e6,  22e6)),
    ],
    "CSKH": [
        ("Giám Đốc CSKH",               4, (70e6,  110e6)),
        ("Trưởng Bộ Phận CSKH",         3, (35e6,  55e6)),
        ("Chuyên Viên CSKH Cao Cấp",    3, (22e6,  38e6)),
        ("Chuyên Viên CSKH",            2, (15e6,  28e6)),
        ("Nhân Viên Tổng Đài",          1, (10e6,  18e6)),
    ],
    "DA": [
        ("Giám Đốc Phát Triển Dự Án",  4, (100e6, 160e6)),
        ("Quản Lý Dự Án (PM)",          3, (45e6,  80e6)),
        ("Chuyên Viên Nghiên Cứu Thị Trường",3,(28e6,50e6)),
        ("Chuyên Viên Thẩm Định",       3, (30e6,  55e6)),
        ("Kỹ Sư Xây Dựng",              2, (20e6,  38e6)),
    ],
    "QHDT": [
        ("Giám Đốc Quan Hệ Đối Tác",   4, (90e6,  140e6)),
        ("Chuyên Viên Quan Hệ Nhà Đầu Tư",3,(35e6, 65e6)),
        ("Chuyên Viên Phát Triển Kinh Doanh",2,(22e6,42e6)),
    ],
    "KT": [
        ("Trưởng Ban Kiểm Toán",        4, (80e6,  120e6)),
        ("Kiểm Toán Viên Nội Bộ",       3, (35e6,  60e6)),
        ("Chuyên Viên Rủi Ro",          2, (25e6,  45e6)),
    ],
    "TT": [
        ("Trưởng Phòng Truyền Thông",   3, (40e6,  65e6)),
        ("Chuyên Viên PR",              2, (20e6,  35e6)),
        ("Nhân Viên Báo Chí",           1, (14e6,  24e6)),
    ],
}

HO_VIET = ["Nguyễn","Trần","Lê","Phạm","Hoàng","Huỳnh","Phan","Vũ","Võ","Đặng",
            "Bùi","Đỗ","Hồ","Ngô","Dương","Lý","Trịnh","Đinh","Tô","Tăng"]
TEN_NAM  = ["Minh","Hùng","Tuấn","Nam","Dũng","Khoa","Hải","Thắng","Quân","Bình",
            "Trung","Phúc","Đức","Tài","Hiếu","Lộc","Thịnh","Cường","Đạt","Vinh"]
TEN_NU   = ["Linh","Hương","Lan","Mai","Thu","Hạnh","Trang","Thảo","Phương","Ngân",
            "Như","Yến","Tuyết","Quỳnh","Ánh","Nhi","Ngọc","Hà","Trâm","Loan"]
TEN_DEM  = ["Văn","Thị","Thanh","Ngọc","Hoàng","Bảo","Quốc","Hữu","Trung","Xuân"]

def gen_name(gender="M"):
    ho = random.choice(HO_VIET)
    dem = random.choice(TEN_DEM)
    ten = random.choice(TEN_NAM if gender == "M" else TEN_NU)
    return f"{ho} {dem} {ten}"

def gen_email(name: str, idx: int) -> str:
    parts = name.lower().replace("đ","d").replace("ă","a").replace("â","a")\
                .replace("ê","e").replace("ô","o").replace("ơ","o").replace("ư","u")\
                .replace("á","a").replace("à","a").replace("ả","a").replace("ã","a").replace("ạ","a")\
                .replace("é","e").replace("è","e").replace("ẻ","e").replace("ẽ","e").replace("ẹ","e")\
                .replace("í","i").replace("ì","i").replace("ỉ","i").replace("ĩ","i").replace("ị","i")\
                .replace("ó","o").replace("ò","o").replace("ỏ","o").replace("õ","o").replace("ọ","o")\
                .replace("ú","u").replace("ù","u").replace("ủ","u").replace("ũ","u").replace("ụ","u")\
                .replace("ý","y").replace("ỳ","y").replace("ỷ","y").replace("ỹ","y").replace("ỵ","y")\
                .split()
    slug = "".join(parts[-1:]) + "".join(parts[:-1])
    return f"{slug}{idx}@prohouzing.vn"

# ── Main Seed ─────────────────────────────────────────────────────────────────
async def seed(db):
    now = now_iso()

    # ── 1. Clear existing seed data ──────────────────────────────────────────
    print("🗑️  Clearing existing seed data...")
    for col in ["employees", "financial_records", "departments", "branches", "org_chart"]:
        await db[col].delete_many({"_seed": True})

    # ── 2. Create Branch IDs ──────────────────────────────────────────────────
    print("🏢 Creating 5 branches...")
    branches = []
    for city in CITIES:
        branch_id = uid()
        branch = {
            "_id":        branch_id,
            "id":         branch_id,
            "code":       f"CN_{city['code']}",
            "name":       f"Chi nhánh {city['name']}",
            "city":       city["name"],
            "city_code":  city["code"],
            "address":    city["address"],
            "phone":      "1900 1234 " + str(random.randint(10,99)),
            "email":      f"{city['code'].lower()}@prohouzing.vn",
            "status":     "active",
            "quota":      city["quota"],
            "is_active":  True,
            "_seed":      True,
            "created_at": now,
            "updated_at": now,
        }
        branches.append(branch)
        await db.branches.insert_one(branch)

    branch_map = {b["city_code"]: b["_id"] for b in branches}

    # ── 3. Create Department records ─────────────────────────────────────────
    print("📂 Creating departments...")
    dept_ids = {}
    for dept in DEPARTMENTS:
        did = uid()
        dept_ids[dept["code"]] = did
        await db.departments.insert_one({
            "_id": did, "id": did,
            "code": dept["code"], "name": dept["name"],
            "status": "active", "is_active": True,
            "_seed": True, "created_at": now,
        })

    # ── 4. Generate 700 employees ────────────────────────────────────────────
    print("👥 Generating 700 employees...")
    employees = []
    idx = 1

    for city in CITIES:
        city_quota = city["quota"]
        for dept in DEPARTMENTS:
            dept_quota = max(1, round(city_quota * dept["city_pct"]))
            positions_in_dept = POSITIONS.get(dept["code"], [
                ("Nhân Viên", 1, (10e6, 20e6))
            ])
            for _ in range(dept_quota):
                if len(employees) >= 700:
                    break
                # Pick position (weighted toward lower levels)
                pos = random.choices(
                    positions_in_dept,
                    weights=[max(1, 5-p[1]) for p in positions_in_dept],
                    k=1
                )[0]
                title, level, (sal_min, sal_max) = pos
                gender = "M" if random.random() > 0.45 else "F"
                name   = gen_name(gender)
                emp_id = uid()
                salary = round(random.uniform(sal_min, sal_max) / 1e6) * 1e6

                emp = {
                    "_id":           emp_id,
                    "id":            emp_id,
                    "employee_code": f"PHV{idx:04d}",
                    "full_name":     name,
                    "gender":        "male" if gender == "M" else "female",
                    "birth_date":    rand_date(1975, 2000),
                    "phone":         rand_phone(),
                    "email":         gen_email(name, idx),
                    "job_title":     title,
                    "level":         level,
                    "department":    dept["name"],
                    "department_code": dept["code"],
                    "department_id": dept_ids[dept["code"]],
                    "branch":        city["name"],
                    "branch_code":   city["code"],
                    "branch_id":     branch_map[city["code"]],
                    "city":          city["name"],
                    "address":       city["address"],
                    "salary":        salary,
                    "employment_type": random.choices(
                        ["full_time","probation","collaborator"],
                        weights=[80, 10, 10]
                    )[0],
                    "joined_at":     rand_date(2016, 2024),
                    "status":        "active",
                    "is_active":     True,
                    "kpi_score":     round(random.uniform(55, 100), 1),
                    "avatar_url":    None,
                    "_seed":         True,
                    "created_at":    now,
                    "updated_at":    now,
                }
                employees.append(emp)
                idx += 1
        if len(employees) >= 700:
            break

    # Ensure exactly 700
    employees = employees[:700]
    await db.employees.insert_many(employees)
    print(f"✅ Inserted {len(employees)} employees")

    # ── 5. Financial Data 3 years ────────────────────────────────────────────
    print("💰 Generating financial records 2022–2024...")

    FINANCIAL_YEARS = [
        {
            "year": 2022,
            "revenue":      180_000_000_000,  # 180 tỷ
            "cogs":          90_000_000_000,  # Giá vốn 90 tỷ
            "gross_profit":  90_000_000_000,  # Lãi gộp 90 tỷ
            "opex":          55_000_000_000,  # Chi phí vận hành 55 tỷ
            "ebitda":        35_000_000_000,  # 35 tỷ
            "depreciation":   5_000_000_000,
            "interest":       3_000_000_000,
            "tax":            5_400_000_000,  # 20% TNDN
            "net_profit":    21_600_000_000,  # Lợi nhuận ròng ~21.6 tỷ
            "note": "Năm khó khăn hậu Covid, thị trường BĐS trầm lắng"
        },
        {
            "year": 2023,
            "revenue":      260_000_000_000,  # 260 tỷ
            "cogs":         130_000_000_000,
            "gross_profit": 130_000_000_000,
            "opex":          75_000_000_000,
            "ebitda":        55_000_000_000,
            "depreciation":   6_000_000_000,
            "interest":       4_000_000_000,
            "tax":            9_000_000_000,
            "net_profit":    36_000_000_000,  # ~36 tỷ
            "note": "Thị trường phục hồi, mở CN Khánh Hoà và Hải Phòng"
        },
        {
            "year": 2024,
            "revenue":      380_000_000_000,  # 380 tỷ
            "cogs":         190_000_000_000,
            "gross_profit": 190_000_000_000,
            "opex":         105_000_000_000,
            "ebitda":        85_000_000_000,
            "depreciation":   8_000_000_000,
            "interest":       5_000_000_000,
            "tax":           14_400_000_000,
            "net_profit":    57_600_000_000,  # ~57.6 tỷ
            "note": "Tăng trưởng mạnh, ra mắt nền tảng ProHouzing App"
        },
    ]

    EXPENSE_CATEGORIES = [
        ("Lương & Phúc lợi",          0.45),
        ("Marketing & Bán hàng",      0.15),
        ("Thuê văn phòng & CSVC",     0.10),
        ("Công nghệ & Hạ tầng",       0.08),
        ("Đào tạo & Phát triển NS",   0.05),
        ("Pháp lý & Tư vấn",          0.05),
        ("Quản lý & Hành chính",      0.07),
        ("Chi phí khác",              0.05),
    ]

    for yr in FINANCIAL_YEARS:
        # Annual summary record
        rec_id = uid()
        annual = {
            "_id":          rec_id,
            "id":           rec_id,
            "type":         "annual_summary",
            "year":         yr["year"],
            "period":       f"{yr['year']}",
            "revenue":      yr["revenue"],
            "cogs":         yr["cogs"],
            "gross_profit": yr["gross_profit"],
            "opex":         yr["opex"],
            "ebitda":       yr["ebitda"],
            "depreciation": yr["depreciation"],
            "interest":     yr["interest"],
            "tax":          yr["tax"],
            "net_profit":   yr["net_profit"],
            "gross_margin": round(yr["gross_profit"]/yr["revenue"]*100, 2),
            "net_margin":   round(yr["net_profit"]/yr["revenue"]*100, 2),
            "note":         yr["note"],
            "currency":     "VND",
            "editable":     True,
            "_seed":        True,
            "created_at":   now,
            "updated_at":   now,
            "created_by":   "system",
        }
        await db.financial_records.insert_one(annual)

        # Monthly revenue breakdown (12 months)
        monthly_revenues = _distribute_monthly(yr["revenue"])
        for mo in range(1, 13):
            mo_rev = monthly_revenues[mo - 1]
            mo_cogs = round(mo_rev * yr["cogs"] / yr["revenue"])
            mo_opex = round(mo_rev * yr["opex"] / yr["revenue"])
            mo_profit = round(mo_rev - mo_cogs - mo_opex - yr["interest"]/12)
            mo_id = uid()
            await db.financial_records.insert_one({
                "_id":      mo_id, "id": mo_id,
                "type":     "monthly",
                "year":     yr["year"],
                "month":    mo,
                "period":   f"{yr['year']}-{mo:02d}",
                "revenue":  mo_rev,
                "cogs":     mo_cogs,
                "opex":     mo_opex,
                "profit":   mo_profit,
                "currency": "VND",
                "editable": True,
                "_seed":    True,
                "created_at": now, "updated_at": now, "created_by": "system",
            })

        # Expense breakdown
        for cat_name, pct in EXPENSE_CATEGORIES:
            cat_id = uid()
            await db.financial_records.insert_one({
                "_id":      cat_id, "id": cat_id,
                "type":     "expense_category",
                "year":     yr["year"],
                "period":   str(yr["year"]),
                "category": cat_name,
                "amount":   round(yr["opex"] * pct),
                "pct_of_opex": round(pct * 100, 1),
                "currency": "VND",
                "editable": True,
                "_seed":    True,
                "created_at": now, "updated_at": now, "created_by": "system",
            })

        # City-level revenue split
        city_weights = [300, 180, 80, 70, 70]
        total_w = sum(city_weights)
        for i, city in enumerate(CITIES):
            cr_id = uid()
            city_rev = round(yr["revenue"] * city_weights[i] / total_w)
            city_profit = round(yr["net_profit"] * city_weights[i] / total_w)
            await db.financial_records.insert_one({
                "_id":      cr_id, "id": cr_id,
                "type":     "city_revenue",
                "year":     yr["year"],
                "city":     city["name"],
                "city_code":city["code"],
                "revenue":  city_rev,
                "profit":   city_profit,
                "currency": "VND",
                "editable": True,
                "_seed":    True,
                "created_at": now, "updated_at": now, "created_by": "system",
            })

    print("✅ Financial data 2022–2024 inserted")

    # ── 6. Summary ──────────────────────────────────────────────────────────
    total_emp = await db.employees.count_documents({"_seed": True})
    total_fin = await db.financial_records.count_documents({"_seed": True})
    print()
    print("═" * 55)
    print(f"✅ SEED HOÀN THÀNH")
    print(f"   Nhân sự:          {total_emp} người")
    print(f"   Bản ghi tài chính:{total_fin} bản ghi")
    print(f"   Chi nhánh:         5 (HCM, HN, ĐN, KH, HP)")
    print(f"   Phòng ban:         {len(DEPARTMENTS)}")
    print(f"   Dữ liệu có thể sửa/xoá qua API")
    print("═" * 55)


def _distribute_monthly(annual_total: int) -> list:
    """Phân bổ doanh thu theo hệ số mùa vụ BĐS Việt Nam"""
    seasonal = [0.05, 0.06, 0.09, 0.08, 0.09, 0.10, 0.08, 0.08, 0.09, 0.10, 0.10, 0.09]
    result = []
    allocated = 0
    for i, pct in enumerate(seasonal):
        if i == 11:
            result.append(annual_total - allocated)
        else:
            v = round(annual_total * pct / 1_000_000) * 1_000_000
            result.append(v)
            allocated += v
    return result


async def main():
    print("🚀 ProHouzing — Seed 700 Employees + Financial Data")
    print(f"   MongoDB: {MONGO_URL}")
    print(f"   Database: {DB_NAME}")
    print()
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await seed(db)
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
