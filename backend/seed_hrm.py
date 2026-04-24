"""
Seed data cho sơ đồ tổ chức ProHouzing
Dựa trên mô hình Cen Land
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

async def seed_org_structure():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Clear existing org data
    await db.org_units.delete_many({})
    await db.job_positions.delete_many({})
    await db.commission_policies.delete_many({})
    
    print("Cleared existing HRM data...")
    
    # ==================== ORGANIZATION STRUCTURE ====================
    org_units = []
    
    # Level 0: Company
    company_id = str(uuid.uuid4())
    org_units.append({
        "id": company_id,
        "name": "ProHouzing Vietnam",
        "code": "PHV",
        "type": "company",
        "parent_id": None,
        "level": 0,
        "path": "/PHV",
        "description": "Công ty Cổ phần Bất động sản ProHouzing Vietnam",
        "address": "Tầng 15, Tòa nhà Landmark 81, Quận Bình Thạnh, TP.HCM",
        "phone": "1900 1234 56",
        "email": "info@prohouzing.vn",
        "order": 0,
        "is_active": True,
        "created_at": now
    })
    
    # Level 1: Hội đồng Quản trị
    hdqt_id = str(uuid.uuid4())
    org_units.append({
        "id": hdqt_id,
        "name": "Hội đồng Quản trị",
        "code": "HDQT",
        "type": "department",
        "parent_id": company_id,
        "level": 1,
        "path": "/PHV/HDQT",
        "description": "Board of Directors",
        "order": 1,
        "is_active": True,
        "created_at": now
    })
    
    # Ủy ban Kiểm toán
    ubkt_id = str(uuid.uuid4())
    org_units.append({
        "id": ubkt_id,
        "name": "Ủy ban Kiểm toán",
        "code": "UBKT",
        "type": "department",
        "parent_id": hdqt_id,
        "level": 2,
        "path": "/PHV/HDQT/UBKT",
        "description": "Audit Committee",
        "order": 1,
        "is_active": True,
        "created_at": now
    })
    
    # Level 1: Tổng Giám đốc
    tgd_id = str(uuid.uuid4())
    org_units.append({
        "id": tgd_id,
        "name": "Ban Tổng Giám đốc",
        "code": "TGD",
        "type": "department",
        "parent_id": company_id,
        "level": 1,
        "path": "/PHV/TGD",
        "description": "General Director Office",
        "order": 2,
        "is_active": True,
        "created_at": now
    })
    
    # ==================== CÁC BAN TRỰC THUỘC TGĐ ====================
    
    # Ban Quan hệ Cổ đông
    ban_qhcd_id = str(uuid.uuid4())
    org_units.append({
        "id": ban_qhcd_id,
        "name": "Ban Quan hệ Cổ đông",
        "code": "QHCD",
        "type": "department",
        "parent_id": tgd_id,
        "level": 2,
        "path": "/PHV/TGD/QHCD",
        "description": "Investor Relations Department",
        "order": 1,
        "is_active": True,
        "created_at": now
    })
    
    # Ban Tài chính
    ban_tc_id = str(uuid.uuid4())
    org_units.append({
        "id": ban_tc_id,
        "name": "Ban Tài chính",
        "code": "TC",
        "type": "department",
        "parent_id": tgd_id,
        "level": 2,
        "path": "/PHV/TGD/TC",
        "description": "Financial Committee",
        "order": 2,
        "is_active": True,
        "created_at": now
    })
    
    # Ban Thẩm định Đầu tư
    ban_tddt_id = str(uuid.uuid4())
    org_units.append({
        "id": ban_tddt_id,
        "name": "Ban Thẩm định Đầu tư",
        "code": "TDDT",
        "type": "department",
        "parent_id": tgd_id,
        "level": 2,
        "path": "/PHV/TGD/TDDT",
        "description": "Investment Review Committee",
        "order": 3,
        "is_active": True,
        "created_at": now
    })
    
    # ==================== KHỐI KINH DOANH ====================
    
    # Phó TGĐ Kinh doanh 1 (Miền Bắc)
    ptgd_kd1_id = str(uuid.uuid4())
    org_units.append({
        "id": ptgd_kd1_id,
        "name": "Khối Kinh doanh Miền Bắc",
        "code": "KD-MB",
        "type": "branch",
        "parent_id": tgd_id,
        "level": 2,
        "path": "/PHV/TGD/KD-MB",
        "description": "Deputy General Director - Northern Region Sales",
        "address": "Tầng 10, Tòa nhà Keangnam, Hà Nội",
        "order": 10,
        "is_active": True,
        "created_at": now
    })
    
    # Các dự án Miền Bắc
    for i in range(1, 4):
        pm_id = str(uuid.uuid4())
        org_units.append({
            "id": pm_id,
            "name": f"Dự án Hà Nội {i}",
            "code": f"HN-DA{i}",
            "type": "team",
            "parent_id": ptgd_kd1_id,
            "level": 3,
            "path": f"/PHV/TGD/KD-MB/HN-DA{i}",
            "description": f"Project Manager - Hà Nội {i}",
            "order": i,
            "is_active": True,
            "created_at": now
        })
    
    # Phó TGĐ Kinh doanh 2 (Miền Nam)
    ptgd_kd2_id = str(uuid.uuid4())
    org_units.append({
        "id": ptgd_kd2_id,
        "name": "Khối Kinh doanh Miền Nam",
        "code": "KD-MN",
        "type": "branch",
        "parent_id": tgd_id,
        "level": 2,
        "path": "/PHV/TGD/KD-MN",
        "description": "Deputy General Director - Southern Region Sales",
        "address": "Tầng 15, Landmark 81, TP.HCM",
        "order": 11,
        "is_active": True,
        "created_at": now
    })
    
    # Các dự án Miền Nam
    for i in range(1, 5):
        pm_id = str(uuid.uuid4())
        org_units.append({
            "id": pm_id,
            "name": f"Dự án TP.HCM {i}",
            "code": f"HCM-DA{i}",
            "type": "team",
            "parent_id": ptgd_kd2_id,
            "level": 3,
            "path": f"/PHV/TGD/KD-MN/HCM-DA{i}",
            "description": f"Project Manager - TP.HCM {i}",
            "order": i,
            "is_active": True,
            "created_at": now
        })
    
    # Phó TGĐ Kinh doanh 3 (Miền Trung)
    ptgd_kd3_id = str(uuid.uuid4())
    org_units.append({
        "id": ptgd_kd3_id,
        "name": "Khối Kinh doanh Miền Trung",
        "code": "KD-MT",
        "type": "branch",
        "parent_id": tgd_id,
        "level": 2,
        "path": "/PHV/TGD/KD-MT",
        "description": "Deputy General Director - Central Region Sales",
        "address": "Đà Nẵng",
        "order": 12,
        "is_active": True,
        "created_at": now
    })
    
    # Các dự án Miền Trung
    for i in range(1, 3):
        pm_id = str(uuid.uuid4())
        org_units.append({
            "id": pm_id,
            "name": f"Dự án Đà Nẵng {i}",
            "code": f"DN-DA{i}",
            "type": "team",
            "parent_id": ptgd_kd3_id,
            "level": 3,
            "path": f"/PHV/TGD/KD-MT/DN-DA{i}",
            "description": f"Project Manager - Đà Nẵng {i}",
            "order": i,
            "is_active": True,
            "created_at": now
        })
    
    # ==================== KHỐI NỘI CHÍNH ====================
    
    ptgd_nc_id = str(uuid.uuid4())
    org_units.append({
        "id": ptgd_nc_id,
        "name": "Khối Nội chính",
        "code": "NC",
        "type": "branch",
        "parent_id": tgd_id,
        "level": 2,
        "path": "/PHV/TGD/NC",
        "description": "Deputy General Director - Internal Affairs",
        "order": 20,
        "is_active": True,
        "created_at": now
    })
    
    # Các phòng ban Nội chính
    internal_depts = [
        ("Phòng Thủ tục", "TT", "Procedure Department"),
        ("Phòng Doanh số", "DS", "Sales Administration Department"),
        ("Ban Pháp chế", "PC", "Legal and Compliance Department"),
        ("Phòng Kế toán", "KT", "Accounting Department"),
        ("Phòng Chăm sóc Khách hàng", "CSKH", "Customer Service Department"),
        ("Phòng Công nghệ", "CN", "Technology Department"),
        ("Phòng IT", "IT", "IT Department"),
        ("Phòng Nhân sự", "NS", "Human Resources Department"),
        ("Phòng Hành chính", "HC", "Administration Department"),
        ("Ban Thanh tra & KSCLĐV", "TTKS", "Inspection & Quality Control Department"),
    ]
    
    for idx, (name, code, desc) in enumerate(internal_depts):
        dept_id = str(uuid.uuid4())
        org_units.append({
            "id": dept_id,
            "name": name,
            "code": code,
            "type": "department",
            "parent_id": ptgd_nc_id,
            "level": 3,
            "path": f"/PHV/TGD/NC/{code}",
            "description": desc,
            "order": idx + 1,
            "is_active": True,
            "created_at": now
        })
    
    # ==================== KHỐI MARKETING ====================
    
    marketing_id = str(uuid.uuid4())
    org_units.append({
        "id": marketing_id,
        "name": "Khối Marketing",
        "code": "MKT",
        "type": "branch",
        "parent_id": tgd_id,
        "level": 2,
        "path": "/PHV/TGD/MKT",
        "description": "Marketing Division",
        "order": 30,
        "is_active": True,
        "created_at": now
    })
    
    mkt_teams = [
        ("Phòng Digital Marketing", "DMK", "Digital Marketing Team"),
        ("Phòng Content", "CTT", "Content Team"),
        ("Phòng Event & Activation", "EVT", "Event & Activation Team"),
        ("Phòng Brand", "BRD", "Brand Team"),
    ]
    
    for idx, (name, code, desc) in enumerate(mkt_teams):
        team_id = str(uuid.uuid4())
        org_units.append({
            "id": team_id,
            "name": name,
            "code": code,
            "type": "department",
            "parent_id": marketing_id,
            "level": 3,
            "path": f"/PHV/TGD/MKT/{code}",
            "description": desc,
            "order": idx + 1,
            "is_active": True,
            "created_at": now
        })
    
    # ==================== CÁC CHI NHÁNH/CÔNG TY CON ====================
    
    subsidiaries = [
        ("ProH Sài Gòn", "PHV-SG", "Chi nhánh Sài Gòn"),
        ("ProH TP.HCM", "PHV-HCM", "Chi nhánh TP.HCM"),
        ("ProH Hà Nội", "PHV-HN", "Chi nhánh Hà Nội"),
        ("ProH Đà Nẵng", "PHV-DN", "Chi nhánh Đà Nẵng"),
        ("ProH Bình Dương", "PHV-BD", "Chi nhánh Bình Dương"),
        ("ProH Đồng Nai", "PHV-DNA", "Chi nhánh Đồng Nai"),
        ("ProH Long An", "PHV-LA", "Chi nhánh Long An"),
        ("ProH Cần Thơ", "PHV-CT", "Chi nhánh Cần Thơ"),
        ("ProH Hải Phòng", "PHV-HP", "Chi nhánh Hải Phòng"),
        ("ProH Nha Trang", "PHV-NT", "Chi nhánh Nha Trang"),
        ("ProHomes Online", "PHV-OL", "Sàn giao dịch Online"),
        ("ProH Premium", "PHV-PM", "Phân khúc Premium"),
    ]
    
    for idx, (name, code, desc) in enumerate(subsidiaries):
        sub_id = str(uuid.uuid4())
        org_units.append({
            "id": sub_id,
            "name": name,
            "code": code,
            "type": "branch",
            "parent_id": company_id,
            "level": 1,
            "path": f"/PHV/{code}",
            "description": desc,
            "order": 100 + idx,
            "is_active": True,
            "created_at": now
        })
    
    # Insert all org units
    if org_units:
        await db.org_units.insert_many(org_units)
        print(f"Inserted {len(org_units)} organization units")
    
    # ==================== JOB POSITIONS ====================
    
    positions = [
        # Cấp cao
        {
            "id": str(uuid.uuid4()),
            "title": "Chủ tịch HĐQT",
            "code": "CTHDQT",
            "department_type": "management",
            "level": 10,
            "description": "Chairman of the Board",
            "responsibilities": ["Điều hành HĐQT", "Định hướng chiến lược", "Đại diện cổ đông"],
            "requirements": ["Kinh nghiệm quản lý 15+ năm", "MBA hoặc tương đương"],
            "skills": ["Leadership", "Strategic Planning", "Corporate Governance"],
            "salary_min": 200000000,
            "salary_max": None,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Tổng Giám đốc",
            "code": "TGD",
            "department_type": "management",
            "level": 9,
            "description": "General Director / CEO",
            "responsibilities": ["Điều hành toàn công ty", "Đạt mục tiêu doanh thu", "Quản lý ban lãnh đạo"],
            "requirements": ["Kinh nghiệm CEO/MD 10+ năm", "Thành tích vượt trội"],
            "skills": ["Executive Leadership", "P&L Management", "Business Development"],
            "salary_min": 150000000,
            "salary_max": 300000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Phó Tổng Giám đốc",
            "code": "PTGD",
            "department_type": "management",
            "level": 8,
            "description": "Deputy General Director",
            "responsibilities": ["Hỗ trợ TGĐ", "Quản lý khối", "Đạt KPI khối"],
            "requirements": ["Kinh nghiệm quản lý cấp cao 8+ năm"],
            "skills": ["Leadership", "Business Strategy", "Team Management"],
            "salary_min": 80000000,
            "salary_max": 150000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        # Cấp trung
        {
            "id": str(uuid.uuid4()),
            "title": "Giám đốc Chi nhánh",
            "code": "GDCN",
            "department_type": "management",
            "level": 7,
            "description": "Branch Director",
            "responsibilities": ["Quản lý chi nhánh", "Đạt doanh số chi nhánh", "Phát triển thị trường"],
            "requirements": ["Kinh nghiệm quản lý 5+ năm", "Am hiểu thị trường địa phương"],
            "skills": ["Branch Management", "Sales Leadership", "Local Market Knowledge"],
            "salary_min": 50000000,
            "salary_max": 100000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Giám đốc Dự án",
            "code": "GDDA",
            "department_type": "sales",
            "level": 6,
            "description": "Project Director",
            "responsibilities": ["Quản lý dự án", "Đạt doanh số dự án", "Quản lý đội ngũ dự án"],
            "requirements": ["Kinh nghiệm BĐS 5+ năm", "Đã quản lý dự án lớn"],
            "skills": ["Project Management", "Sales Strategy", "Team Leadership"],
            "salary_min": 40000000,
            "salary_max": 80000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Trưởng phòng",
            "code": "TP",
            "department_type": "management",
            "level": 5,
            "description": "Department Head / Manager",
            "responsibilities": ["Quản lý phòng ban", "Báo cáo Ban lãnh đạo", "Phát triển team"],
            "requirements": ["Kinh nghiệm 3+ năm trong lĩnh vực", "Kỹ năng quản lý tốt"],
            "skills": ["People Management", "Department Operations", "Reporting"],
            "salary_min": 25000000,
            "salary_max": 50000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        # Sales
        {
            "id": str(uuid.uuid4()),
            "title": "Team Leader Sales",
            "code": "TL",
            "department_type": "sales",
            "level": 4,
            "description": "Sales Team Leader",
            "responsibilities": ["Quản lý team 5-10 sales", "Đào tạo nhân viên mới", "Đạt KPI team"],
            "requirements": ["Kinh nghiệm sales BĐS 3+ năm", "Doanh số cá nhân top 10%"],
            "skills": ["Sales Leadership", "Coaching", "Target Achievement"],
            "salary_min": 20000000,
            "salary_max": 40000000,
            "kpi_targets": {"team_revenue": 10000000000, "conversion_rate": 8},
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Senior Sales Executive",
            "code": "SSE",
            "department_type": "sales",
            "level": 3,
            "description": "Chuyên viên Kinh doanh Cấp cao",
            "responsibilities": ["Tư vấn khách VIP", "Mentor nhân viên mới", "Đạt KPI cá nhân"],
            "requirements": ["Kinh nghiệm sales BĐS 2+ năm", "Thành tích tốt"],
            "skills": ["Consultative Selling", "Negotiation", "VIP Customer Management"],
            "salary_min": 15000000,
            "salary_max": 30000000,
            "kpi_targets": {"deals_per_month": 3, "revenue": 5000000000},
            "is_management": False,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Sales Executive",
            "code": "SE",
            "department_type": "sales",
            "level": 2,
            "description": "Nhân viên Kinh doanh",
            "responsibilities": ["Tư vấn khách hàng", "Chăm sóc lead", "Đạt KPI doanh số"],
            "requirements": ["Tốt nghiệp CĐ/ĐH", "Kỹ năng giao tiếp tốt", "Có xe máy"],
            "skills": ["Sales", "Customer Service", "MS Office"],
            "salary_min": 8000000,
            "salary_max": 15000000,
            "kpi_targets": {"leads_per_month": 20, "conversion_rate": 5},
            "is_management": False,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Sales Fresher",
            "code": "SF",
            "department_type": "sales",
            "level": 1,
            "description": "Nhân viên Kinh doanh Tập sự",
            "responsibilities": ["Học hỏi sản phẩm", "Hỗ trợ senior", "Telesales"],
            "requirements": ["Tốt nghiệp CĐ/ĐH", "Nhiệt tình, chịu khó"],
            "skills": ["Communication", "Learning Ability"],
            "salary_min": 5000000,
            "salary_max": 8000000,
            "kpi_targets": {"calls_per_day": 50, "appointments": 5},
            "is_management": False,
            "is_active": True,
            "created_at": now
        },
        # Marketing
        {
            "id": str(uuid.uuid4()),
            "title": "Marketing Manager",
            "code": "MM",
            "department_type": "marketing",
            "level": 5,
            "description": "Trưởng phòng Marketing",
            "responsibilities": ["Lên chiến lược marketing", "Quản lý ngân sách", "Đo lường hiệu quả"],
            "requirements": ["Kinh nghiệm marketing 5+ năm", "Có kinh nghiệm BĐS"],
            "skills": ["Marketing Strategy", "Budget Management", "Analytics"],
            "salary_min": 30000000,
            "salary_max": 60000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Digital Marketing Specialist",
            "code": "DMS",
            "department_type": "marketing",
            "level": 3,
            "description": "Chuyên viên Digital Marketing",
            "responsibilities": ["Chạy ads Facebook, Google", "SEO/SEM", "Phân tích data"],
            "requirements": ["Kinh nghiệm 2+ năm digital marketing"],
            "skills": ["Facebook Ads", "Google Ads", "Analytics", "SEO"],
            "salary_min": 15000000,
            "salary_max": 25000000,
            "kpi_targets": {"leads_per_month": 200, "cost_per_lead": 80000},
            "is_management": False,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Content Creator",
            "code": "CC",
            "department_type": "content",
            "level": 2,
            "description": "Nhân viên Sáng tạo Nội dung",
            "responsibilities": ["Viết content", "Sáng tạo video", "Quản lý fanpage"],
            "requirements": ["Kinh nghiệm content 1+ năm", "Viết tốt, sáng tạo"],
            "skills": ["Copywriting", "Video Editing", "Social Media"],
            "salary_min": 10000000,
            "salary_max": 18000000,
            "is_management": False,
            "is_active": True,
            "created_at": now
        },
        # HR & Admin
        {
            "id": str(uuid.uuid4()),
            "title": "HR Manager",
            "code": "HRM",
            "department_type": "hr",
            "level": 5,
            "description": "Trưởng phòng Nhân sự",
            "responsibilities": ["Tuyển dụng", "Đào tạo", "Quản lý C&B", "Văn hóa công ty"],
            "requirements": ["Kinh nghiệm HR 5+ năm", "Hiểu luật lao động"],
            "skills": ["Recruitment", "Training", "C&B", "Labor Law"],
            "salary_min": 25000000,
            "salary_max": 45000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "HR Executive",
            "code": "HRE",
            "department_type": "hr",
            "level": 2,
            "description": "Nhân viên Nhân sự",
            "responsibilities": ["Hỗ trợ tuyển dụng", "Quản lý hồ sơ", "Chấm công"],
            "requirements": ["Kinh nghiệm HR 1+ năm"],
            "skills": ["Recruitment Support", "Admin", "Excel"],
            "salary_min": 8000000,
            "salary_max": 15000000,
            "is_management": False,
            "is_active": True,
            "created_at": now
        },
        # Finance
        {
            "id": str(uuid.uuid4()),
            "title": "Kế toán trưởng",
            "code": "KTT",
            "department_type": "finance",
            "level": 5,
            "description": "Chief Accountant",
            "responsibilities": ["Quản lý sổ sách", "Báo cáo tài chính", "Tuân thủ thuế"],
            "requirements": ["Kinh nghiệm kế toán 5+ năm", "Chứng chỉ CPA/ACCA"],
            "skills": ["Financial Reporting", "Tax", "ERP Systems"],
            "salary_min": 25000000,
            "salary_max": 50000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Kế toán viên",
            "code": "KTV",
            "department_type": "finance",
            "level": 2,
            "description": "Accountant",
            "responsibilities": ["Ghi chép sổ sách", "Hóa đơn", "Báo cáo"],
            "requirements": ["Tốt nghiệp Kế toán/Tài chính"],
            "skills": ["Accounting", "Excel", "ERP"],
            "salary_min": 8000000,
            "salary_max": 15000000,
            "is_management": False,
            "is_active": True,
            "created_at": now
        },
        # IT
        {
            "id": str(uuid.uuid4()),
            "title": "IT Manager",
            "code": "ITM",
            "department_type": "it",
            "level": 5,
            "description": "Trưởng phòng IT",
            "responsibilities": ["Quản lý hệ thống IT", "Bảo mật", "Phát triển phần mềm"],
            "requirements": ["Kinh nghiệm IT 5+ năm"],
            "skills": ["System Administration", "Security", "Software Development"],
            "salary_min": 30000000,
            "salary_max": 60000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        # Customer Service
        {
            "id": str(uuid.uuid4()),
            "title": "CSKH Supervisor",
            "code": "CSKHS",
            "department_type": "support",
            "level": 4,
            "description": "Supervisor Chăm sóc Khách hàng",
            "responsibilities": ["Quản lý team CSKH", "Xử lý khiếu nại", "Nâng cao CSAT"],
            "requirements": ["Kinh nghiệm CSKH 3+ năm"],
            "skills": ["Customer Service", "Problem Solving", "Team Management"],
            "salary_min": 15000000,
            "salary_max": 25000000,
            "is_management": True,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Nhân viên CSKH",
            "code": "CSKH",
            "department_type": "support",
            "level": 2,
            "description": "Customer Service Executive",
            "responsibilities": ["Hỗ trợ khách hàng", "Giải đáp thắc mắc", "Follow-up"],
            "requirements": ["Kỹ năng giao tiếp tốt", "Kiên nhẫn"],
            "skills": ["Customer Service", "Communication", "CRM"],
            "salary_min": 7000000,
            "salary_max": 12000000,
            "is_management": False,
            "is_active": True,
            "created_at": now
        },
    ]
    
    if positions:
        await db.job_positions.insert_many(positions)
        print(f"Inserted {len(positions)} job positions")
    
    # ==================== COMMISSION POLICIES ====================
    
    policies = [
        {
            "id": str(uuid.uuid4()),
            "name": "Chính sách CTV Tiêu chuẩn",
            "code": "CTV-STD",
            "type": "tiered",
            "description": "Áp dụng cho CTV mới đăng ký",
            "tiers": [
                {"min_deals": 1, "max_deals": 3, "rate": 0.8, "bonus": 0},
                {"min_deals": 4, "max_deals": 7, "rate": 1.0, "bonus": 500000},
                {"min_deals": 8, "max_deals": 12, "rate": 1.2, "bonus": 1000000},
                {"min_deals": 13, "max_deals": None, "rate": 1.5, "bonus": 2000000},
            ],
            "min_deal_value": 1000000000,  # 1 tỷ
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Chính sách CTV VIP",
            "code": "CTV-VIP",
            "type": "tiered",
            "description": "Dành cho CTV có thành tích xuất sắc (10+ deals/năm)",
            "tiers": [
                {"min_deals": 1, "max_deals": 2, "rate": 1.2, "bonus": 500000},
                {"min_deals": 3, "max_deals": 5, "rate": 1.5, "bonus": 1500000},
                {"min_deals": 6, "max_deals": 10, "rate": 1.8, "bonus": 3000000},
                {"min_deals": 11, "max_deals": None, "rate": 2.0, "bonus": 5000000},
            ],
            "min_deal_value": 500000000,  # 500 triệu
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Chính sách CTV Premium",
            "code": "CTV-PRE",
            "type": "tiered",
            "description": "Dành cho CTV bán sản phẩm cao cấp (5 tỷ+)",
            "tiers": [
                {"min_deals": 1, "max_deals": 1, "rate": 1.5, "bonus": 2000000},
                {"min_deals": 2, "max_deals": 3, "rate": 1.8, "bonus": 4000000},
                {"min_deals": 4, "max_deals": None, "rate": 2.2, "bonus": 8000000},
            ],
            "min_deal_value": 5000000000,  # 5 tỷ
            "is_active": True,
            "created_at": now
        },
    ]
    
    if policies:
        await db.commission_policies.insert_many(policies)
        print(f"Inserted {len(policies)} commission policies")
    
    # ==================== SAMPLE COLLABORATORS ====================
    
    policy_std_id = policies[0]["id"]
    policy_vip_id = policies[1]["id"]
    
    collaborators = [
        {
            "id": str(uuid.uuid4()),
            "code": "CTV0001",
            "full_name": "Nguyễn Văn An",
            "phone": "0901234567",
            "email": "an.nguyen@gmail.com",
            "id_number": "001234567890",
            "address": "123 Nguyễn Trãi, Q.1, TP.HCM",
            "bank_name": "Vietcombank",
            "bank_account": "1234567890",
            "bank_branch": "Chi nhánh TP.HCM",
            "commission_policy_id": policy_vip_id,
            "status": "active",
            "join_date": "2023-06-15T00:00:00Z",
            "last_activity": now,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "code": "CTV0002",
            "full_name": "Trần Thị Bình",
            "phone": "0912345678",
            "email": "binh.tran@gmail.com",
            "id_number": "001234567891",
            "address": "456 Lê Lợi, Q.3, TP.HCM",
            "bank_name": "Techcombank",
            "bank_account": "9876543210",
            "bank_branch": "Chi nhánh Sài Gòn",
            "commission_policy_id": policy_std_id,
            "status": "active",
            "join_date": "2024-01-10T00:00:00Z",
            "last_activity": now,
            "is_active": True,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "code": "CTV0003",
            "full_name": "Lê Văn Cường",
            "phone": "0923456789",
            "email": "cuong.le@gmail.com",
            "address": "789 Trần Hưng Đạo, Hà Nội",
            "bank_name": "BIDV",
            "bank_account": "5555666677",
            "bank_branch": "Chi nhánh Hà Nội",
            "commission_policy_id": policy_std_id,
            "status": "pending",
            "join_date": now,
            "is_active": True,
            "created_at": now
        },
    ]
    
    if collaborators:
        await db.collaborators.insert_many(collaborators)
        print(f"Inserted {len(collaborators)} collaborators")
    
    print("\n✅ HRM seed data completed!")
    print(f"   - {len(org_units)} organization units")
    print(f"   - {len(positions)} job positions")
    print(f"   - {len(policies)} commission policies")
    print(f"   - {len(collaborators)} collaborators")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_org_structure())
