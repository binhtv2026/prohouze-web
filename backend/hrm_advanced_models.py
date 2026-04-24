"""
ProHouzing HRM Advanced Module
Quản lý Nhân sự Toàn diện cho Doanh nghiệp Bất động sản
Tuân thủ Bộ luật Lao động Việt Nam 2019 (Luật số 45/2019/QH14)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone

# ==================== ENUMS ====================

# Loại hợp đồng theo Điều 20 BLLĐ 2019
class ContractType(str, Enum):
    PROBATION = "probation"  # Hợp đồng thử việc (Điều 24-27)
    FIXED_TERM = "fixed_term"  # HĐ xác định thời hạn (≤36 tháng)
    INDEFINITE = "indefinite"  # HĐ không xác định thời hạn
    SEASONAL = "seasonal"  # HĐ theo mùa vụ/công việc (<12 tháng)
    PART_TIME = "part_time"  # HĐ bán thời gian

class SalaryType(str, Enum):
    GROSS = "gross"  # Lương Gross (chưa trừ thuế, BHXH)
    NET = "net"  # Lương Net (thực nhận)

class EmployeeStatus(str, Enum):
    CANDIDATE = "candidate"  # Ứng viên
    ONBOARDING = "onboarding"  # Đang onboard
    PROBATION = "probation"  # Thử việc
    ACTIVE = "active"  # Đang làm việc
    ON_LEAVE = "on_leave"  # Nghỉ phép dài hạn
    SUSPENDED = "suspended"  # Tạm nghỉ
    RESIGNED = "resigned"  # Đã nghỉ việc
    TERMINATED = "terminated"  # Bị sa thải

class Department(str, Enum):
    # Front Office - Kinh doanh
    SALES = "sales"  # Phòng Kinh doanh
    BUSINESS_DEV = "business_dev"  # Phát triển kinh doanh
    
    # Marketing
    MARKETING = "marketing"  # Marketing
    CONTENT = "content"  # Content Creator
    DIGITAL = "digital"  # Digital Marketing
    
    # Back Office
    HR = "hr"  # Nhân sự
    FINANCE = "finance"  # Tài chính - Kế toán
    ACCOUNTING = "accounting"  # Kế toán
    LEGAL = "legal"  # Pháp lý
    ADMIN = "admin"  # Hành chính
    IT = "it"  # IT
    CUSTOMER_SERVICE = "customer_service"  # CSKH
    
    # Management
    MANAGEMENT = "management"  # Ban điều hành
    BOD = "bod"  # Ban Giám đốc

class PositionLevel(str, Enum):
    INTERN = "intern"  # Thực tập sinh
    FRESHER = "fresher"  # Fresher
    JUNIOR = "junior"  # Junior
    SENIOR = "senior"  # Senior
    LEAD = "lead"  # Team Lead
    MANAGER = "manager"  # Manager
    SENIOR_MANAGER = "senior_manager"  # Senior Manager
    DIRECTOR = "director"  # Director/Giám đốc
    VP = "vp"  # Vice President
    CEO = "ceo"  # CEO/Tổng Giám đốc

class RecruitmentStatus(str, Enum):
    DRAFT = "draft"  # Nháp
    OPEN = "open"  # Đang tuyển
    CLOSED = "closed"  # Đã đóng
    ON_HOLD = "on_hold"  # Tạm dừng
    FILLED = "filled"  # Đã tuyển đủ

class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"  # Đã nộp
    SCREENING = "screening"  # Đang sàng lọc CV
    INTERVIEW_HR = "interview_hr"  # Phỏng vấn HR
    INTERVIEW_TECH = "interview_tech"  # Phỏng vấn chuyên môn
    INTERVIEW_MANAGER = "interview_manager"  # Phỏng vấn Manager
    INTERVIEW_BOD = "interview_bod"  # Phỏng vấn BOD
    ASSESSMENT = "assessment"  # Làm bài test
    OFFER = "offer"  # Đã gửi offer
    ACCEPTED = "accepted"  # Đã nhận offer
    REJECTED = "rejected"  # Bị từ chối
    WITHDRAWN = "withdrawn"  # Ứng viên rút đơn
    ONBOARDING = "onboarding"  # Đang onboard

class TrainingType(str, Enum):
    ONBOARDING = "onboarding"  # Đào tạo hội nhập
    SKILL = "skill"  # Đào tạo kỹ năng
    PRODUCT = "product"  # Đào tạo sản phẩm
    COMPLIANCE = "compliance"  # Đào tạo tuân thủ
    LEADERSHIP = "leadership"  # Đào tạo lãnh đạo
    CERTIFICATION = "certification"  # Chứng chỉ

class TrainingStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"

class LeaveType(str, Enum):
    ANNUAL = "annual"  # Phép năm (12 ngày theo Điều 113)
    SICK = "sick"  # Nghỉ ốm (BHXH chi trả)
    MATERNITY = "maternity"  # Thai sản (6 tháng)
    PATERNITY = "paternity"  # Nghỉ khi vợ sinh (5-7 ngày)
    WEDDING = "wedding"  # Nghỉ cưới (3 ngày)
    FUNERAL = "funeral"  # Nghỉ tang (3 ngày)
    PERSONAL = "personal"  # Nghỉ việc riêng
    UNPAID = "unpaid"  # Nghỉ không lương
    COMPENSATORY = "compensatory"  # Nghỉ bù

class DisciplineType(str, Enum):
    WARNING = "warning"  # Khiển trách (Điều 124)
    DEMOTION = "demotion"  # Kéo dài thời hạn nâng lương ≤6 tháng
    DEMOTION_POSITION = "demotion_position"  # Cách chức
    TERMINATION = "termination"  # Sa thải

class RewardType(str, Enum):
    BONUS = "bonus"  # Thưởng tiền
    PROMOTION = "promotion"  # Thăng chức
    RECOGNITION = "recognition"  # Bằng khen/Giấy khen
    GIFT = "gift"  # Quà tặng
    TRAINING = "training"  # Cơ hội đào tạo

# ==================== JOB POSITIONS - Danh mục Chức danh ====================

# Định nghĩa tất cả vị trí trong công ty BĐS
POSITION_CATALOG = {
    # === SALES - KINH DOANH ===
    "sales": {
        "department": Department.SALES,
        "positions": [
            {
                "code": "SE",
                "title": "Nhân viên Kinh doanh",
                "title_en": "Sales Executive",
                "level": PositionLevel.JUNIOR,
                "is_management": False,
                "salary_range": {"min": 8000000, "max": 15000000},
                "commission_eligible": True,
                "description": "Tư vấn và bán bất động sản cho khách hàng",
                "responsibilities": [
                    "Tư vấn khách hàng về sản phẩm BĐS",
                    "Dẫn khách tham quan dự án",
                    "Hoàn thiện hồ sơ giao dịch",
                    "Chăm sóc khách hàng sau bán",
                    "Đạt KPI doanh số được giao"
                ],
                "requirements": [
                    "Tốt nghiệp CĐ/ĐH",
                    "Kỹ năng giao tiếp, thuyết phục tốt",
                    "Ngoại hình ưa nhìn",
                    "Có xe máy, laptop",
                    "Chịu được áp lực công việc"
                ],
                "kpi": {"leads_per_month": 20, "conversion_rate": 5, "revenue_target": 2000000000}
            },
            {
                "code": "SSE",
                "title": "Chuyên viên Kinh doanh Cao cấp",
                "title_en": "Senior Sales Executive",
                "level": PositionLevel.SENIOR,
                "is_management": False,
                "salary_range": {"min": 15000000, "max": 25000000},
                "commission_eligible": True,
                "description": "Chuyên viên kinh doanh có kinh nghiệm, xử lý các deal lớn",
                "responsibilities": [
                    "Xử lý khách hàng VIP/Deal lớn",
                    "Hỗ trợ đào tạo nhân viên mới",
                    "Tham gia các event, roadshow",
                    "Xây dựng mối quan hệ khách hàng dài hạn"
                ],
                "requirements": [
                    "2+ năm kinh nghiệm sales BĐS",
                    "Có track record tốt",
                    "Khả năng xử lý deal lớn"
                ],
                "kpi": {"leads_per_month": 15, "conversion_rate": 8, "revenue_target": 5000000000}
            },
            {
                "code": "TL",
                "title": "Trưởng nhóm Kinh doanh",
                "title_en": "Sales Team Leader",
                "level": PositionLevel.LEAD,
                "is_management": True,
                "salary_range": {"min": 18000000, "max": 35000000},
                "commission_eligible": True,
                "description": "Quản lý team 5-10 nhân viên kinh doanh",
                "responsibilities": [
                    "Quản lý, điều phối team 5-10 người",
                    "Đào tạo, coaching nhân viên",
                    "Phân bổ lead cho team",
                    "Báo cáo doanh số định kỳ",
                    "Hỗ trợ close deal khó"
                ],
                "requirements": [
                    "3+ năm kinh nghiệm sales BĐS",
                    "1+ năm kinh nghiệm quản lý",
                    "Khả năng leadership, coaching"
                ],
                "kpi": {"team_revenue": 10000000000, "team_conversion": 6, "retention_rate": 80}
            },
            {
                "code": "SM",
                "title": "Trưởng phòng Kinh doanh",
                "title_en": "Sales Manager",
                "level": PositionLevel.MANAGER,
                "is_management": True,
                "salary_range": {"min": 30000000, "max": 50000000},
                "commission_eligible": True,
                "description": "Quản lý toàn bộ hoạt động kinh doanh của chi nhánh/khu vực",
                "responsibilities": [
                    "Xây dựng chiến lược kinh doanh",
                    "Quản lý đội ngũ Team Leader",
                    "Thiết lập và giám sát KPI",
                    "Phối hợp với Marketing, Pháp lý",
                    "Báo cáo BGĐ"
                ],
                "requirements": [
                    "5+ năm kinh nghiệm sales BĐS",
                    "3+ năm kinh nghiệm quản lý",
                    "Có network khách hàng tốt"
                ],
                "kpi": {"branch_revenue": 50000000000, "margin": 25, "team_growth": 20}
            },
            {
                "code": "SD",
                "title": "Giám đốc Kinh doanh",
                "title_en": "Sales Director",
                "level": PositionLevel.DIRECTOR,
                "is_management": True,
                "salary_range": {"min": 50000000, "max": 100000000},
                "commission_eligible": True,
                "description": "Điều hành toàn bộ hoạt động kinh doanh công ty",
                "responsibilities": [
                    "Hoạch định chiến lược kinh doanh tổng thể",
                    "Mở rộng thị trường, kênh phân phối",
                    "Quản lý các Sales Manager",
                    "Đàm phán hợp tác chiến lược",
                    "Tham gia BOD"
                ],
                "requirements": [
                    "10+ năm kinh nghiệm ngành BĐS",
                    "5+ năm vị trí quản lý cấp cao",
                    "MBA hoặc tương đương"
                ],
                "kpi": {"company_revenue": 500000000000, "market_share": 5, "profit_margin": 20}
            }
        ]
    },
    
    # === MARKETING ===
    "marketing": {
        "department": Department.MARKETING,
        "positions": [
            {
                "code": "MC",
                "title": "Nhân viên Marketing",
                "title_en": "Marketing Coordinator",
                "level": PositionLevel.JUNIOR,
                "is_management": False,
                "salary_range": {"min": 10000000, "max": 18000000},
                "commission_eligible": False,
                "description": "Hỗ trợ triển khai các hoạt động marketing",
                "responsibilities": [
                    "Hỗ trợ tổ chức event, roadshow",
                    "Quản lý vật phẩm marketing",
                    "Theo dõi hiệu quả chiến dịch",
                    "Phối hợp với agency"
                ],
                "requirements": [
                    "Tốt nghiệp Marketing/Truyền thông",
                    "1+ năm kinh nghiệm",
                    "Sử dụng thành thạo các công cụ marketing"
                ],
                "kpi": {"events_per_month": 4, "lead_cost": 100000}
            },
            {
                "code": "DM",
                "title": "Chuyên viên Digital Marketing",
                "title_en": "Digital Marketing Specialist",
                "level": PositionLevel.SENIOR,
                "is_management": False,
                "salary_range": {"min": 15000000, "max": 25000000},
                "commission_eligible": False,
                "description": "Quản lý các kênh digital marketing",
                "responsibilities": [
                    "Chạy quảng cáo Facebook, Google Ads",
                    "Tối ưu SEO/SEM",
                    "Phân tích data, báo cáo hiệu quả",
                    "A/B testing campaigns"
                ],
                "requirements": [
                    "2+ năm kinh nghiệm Digital Marketing",
                    "Chứng chỉ Google Ads, Facebook Blueprint",
                    "Phân tích dữ liệu tốt"
                ],
                "kpi": {"cpl": 80000, "leads_per_month": 500, "roas": 5}
            },
            {
                "code": "CC",
                "title": "Content Creator",
                "title_en": "Content Creator",
                "level": PositionLevel.JUNIOR,
                "is_management": False,
                "salary_range": {"min": 10000000, "max": 20000000},
                "commission_eligible": False,
                "description": "Sáng tạo nội dung cho các kênh truyền thông",
                "responsibilities": [
                    "Viết bài PR, review dự án",
                    "Tạo content cho social media",
                    "Quay/dựng video ngắn",
                    "Chụp hình dự án"
                ],
                "requirements": [
                    "Kỹ năng viết lách tốt",
                    "Sử dụng Canva, Capcut, Premiere",
                    "Có khiếu thẩm mỹ"
                ],
                "kpi": {"posts_per_week": 15, "engagement_rate": 3}
            },
            {
                "code": "MM",
                "title": "Trưởng phòng Marketing",
                "title_en": "Marketing Manager",
                "level": PositionLevel.MANAGER,
                "is_management": True,
                "salary_range": {"min": 30000000, "max": 50000000},
                "commission_eligible": False,
                "description": "Quản lý toàn bộ hoạt động marketing",
                "responsibilities": [
                    "Xây dựng chiến lược marketing tổng thể",
                    "Quản lý ngân sách marketing",
                    "Quản lý team marketing",
                    "Phối hợp với Sales để đạt target lead"
                ],
                "requirements": [
                    "5+ năm kinh nghiệm marketing",
                    "Kinh nghiệm ngành BĐS ưu tiên",
                    "Khả năng quản lý team"
                ],
                "kpi": {"total_leads": 2000, "cpl": 75000, "brand_awareness": 80}
            }
        ]
    },
    
    # === BACK OFFICE - HR ===
    "hr": {
        "department": Department.HR,
        "positions": [
            {
                "code": "HRC",
                "title": "Nhân viên Nhân sự",
                "title_en": "HR Coordinator",
                "level": PositionLevel.JUNIOR,
                "is_management": False,
                "salary_range": {"min": 10000000, "max": 15000000},
                "commission_eligible": False,
                "description": "Hỗ trợ các công việc nhân sự",
                "responsibilities": [
                    "Đăng tin tuyển dụng, sàng lọc CV",
                    "Hỗ trợ onboarding nhân viên mới",
                    "Quản lý hồ sơ nhân sự",
                    "Chấm công, tính lương"
                ],
                "requirements": [
                    "Tốt nghiệp Quản trị nhân sự",
                    "Thành thạo Excel",
                    "Cẩn thận, tỉ mỉ"
                ],
                "kpi": {"time_to_hire": 30, "onboarding_completion": 95}
            },
            {
                "code": "RC",
                "title": "Chuyên viên Tuyển dụng",
                "title_en": "Recruiter",
                "level": PositionLevel.SENIOR,
                "is_management": False,
                "salary_range": {"min": 12000000, "max": 20000000},
                "commission_eligible": False,
                "description": "Chuyên trách tuyển dụng",
                "responsibilities": [
                    "Headhunt ứng viên tiềm năng",
                    "Phỏng vấn sơ tuyển",
                    "Đàm phán offer",
                    "Xây dựng employer branding"
                ],
                "requirements": [
                    "2+ năm kinh nghiệm tuyển dụng",
                    "Network rộng",
                    "Kỹ năng đánh giá ứng viên"
                ],
                "kpi": {"hires_per_month": 10, "quality_of_hire": 80, "offer_acceptance": 85}
            },
            {
                "code": "HRBP",
                "title": "HR Business Partner",
                "title_en": "HR Business Partner",
                "level": PositionLevel.SENIOR,
                "is_management": False,
                "salary_range": {"min": 18000000, "max": 30000000},
                "commission_eligible": False,
                "description": "Đối tác chiến lược HR cho các phòng ban",
                "responsibilities": [
                    "Tư vấn chiến lược nhân sự cho phòng ban",
                    "Xử lý quan hệ lao động",
                    "Đào tạo và phát triển nhân viên",
                    "Quản lý hiệu suất"
                ],
                "requirements": [
                    "3+ năm kinh nghiệm HR",
                    "Kiến thức luật lao động",
                    "Kỹ năng tư vấn, coaching"
                ],
                "kpi": {"employee_satisfaction": 80, "turnover_rate": 15, "training_hours": 40}
            },
            {
                "code": "HRM",
                "title": "Trưởng phòng Nhân sự",
                "title_en": "HR Manager",
                "level": PositionLevel.MANAGER,
                "is_management": True,
                "salary_range": {"min": 25000000, "max": 45000000},
                "commission_eligible": False,
                "description": "Quản lý toàn bộ hoạt động nhân sự",
                "responsibilities": [
                    "Xây dựng chiến lược nhân sự",
                    "Quản lý team HR",
                    "Xây dựng chính sách phúc lợi",
                    "Báo cáo BGĐ về tình hình nhân sự"
                ],
                "requirements": [
                    "5+ năm kinh nghiệm HR",
                    "3+ năm quản lý",
                    "Kiến thức sâu về luật lao động"
                ],
                "kpi": {"headcount_plan": 100, "budget_efficiency": 90, "engagement_score": 75}
            }
        ]
    },
    
    # === BACK OFFICE - FINANCE/ACCOUNTING ===
    "finance": {
        "department": Department.FINANCE,
        "positions": [
            {
                "code": "ACC",
                "title": "Nhân viên Kế toán",
                "title_en": "Accountant",
                "level": PositionLevel.JUNIOR,
                "is_management": False,
                "salary_range": {"min": 10000000, "max": 18000000},
                "commission_eligible": False,
                "description": "Thực hiện công việc kế toán hàng ngày",
                "responsibilities": [
                    "Hạch toán chứng từ",
                    "Theo dõi công nợ",
                    "Lập báo cáo thuế",
                    "Đối chiếu ngân hàng"
                ],
                "requirements": [
                    "Tốt nghiệp Kế toán/Tài chính",
                    "Có chứng chỉ kế toán viên",
                    "Thành thạo phần mềm kế toán"
                ],
                "kpi": {"accuracy_rate": 99, "deadline_compliance": 100}
            },
            {
                "code": "SACC",
                "title": "Kế toán Tổng hợp",
                "title_en": "Senior Accountant",
                "level": PositionLevel.SENIOR,
                "is_management": False,
                "salary_range": {"min": 15000000, "max": 25000000},
                "commission_eligible": False,
                "description": "Tổng hợp số liệu và lập báo cáo tài chính",
                "responsibilities": [
                    "Lập báo cáo tài chính",
                    "Kiểm tra, đối chiếu số liệu",
                    "Phân tích chi phí",
                    "Hỗ trợ kiểm toán"
                ],
                "requirements": [
                    "3+ năm kinh nghiệm kế toán",
                    "Nắm vững chuẩn mực kế toán VAS",
                    "Kinh nghiệm lập BCTC"
                ],
                "kpi": {"report_accuracy": 99, "closing_time": 5}
            },
            {
                "code": "CAC",
                "title": "Kế toán trưởng",
                "title_en": "Chief Accountant",
                "level": PositionLevel.MANAGER,
                "is_management": True,
                "salary_range": {"min": 25000000, "max": 40000000},
                "commission_eligible": False,
                "description": "Phụ trách toàn bộ công tác kế toán",
                "responsibilities": [
                    "Tổ chức bộ máy kế toán",
                    "Ký duyệt chứng từ, báo cáo",
                    "Làm việc với cơ quan thuế",
                    "Kiểm soát chi phí"
                ],
                "requirements": [
                    "5+ năm kinh nghiệm kế toán",
                    "Chứng chỉ Kế toán trưởng",
                    "Kinh nghiệm ngành BĐS ưu tiên"
                ],
                "kpi": {"compliance_rate": 100, "audit_findings": 0}
            },
            {
                "code": "CFO",
                "title": "Giám đốc Tài chính",
                "title_en": "Chief Financial Officer",
                "level": PositionLevel.DIRECTOR,
                "is_management": True,
                "salary_range": {"min": 50000000, "max": 100000000},
                "commission_eligible": False,
                "description": "Điều hành toàn bộ hoạt động tài chính",
                "responsibilities": [
                    "Hoạch định chiến lược tài chính",
                    "Quản lý dòng tiền, đầu tư",
                    "Quan hệ ngân hàng, nhà đầu tư",
                    "Tham gia BOD"
                ],
                "requirements": [
                    "10+ năm kinh nghiệm tài chính",
                    "CPA/ACCA/CFA",
                    "MBA ưu tiên"
                ],
                "kpi": {"roi": 20, "cash_flow_health": 100, "funding_cost": 10}
            }
        ]
    },
    
    # === BACK OFFICE - LEGAL ===
    "legal": {
        "department": Department.LEGAL,
        "positions": [
            {
                "code": "LO",
                "title": "Nhân viên Pháp lý",
                "title_en": "Legal Officer",
                "level": PositionLevel.JUNIOR,
                "is_management": False,
                "salary_range": {"min": 12000000, "max": 20000000},
                "commission_eligible": False,
                "description": "Hỗ trợ công tác pháp lý",
                "responsibilities": [
                    "Soạn thảo hợp đồng",
                    "Kiểm tra hồ sơ pháp lý dự án",
                    "Hỗ trợ thủ tục công chứng",
                    "Lưu trữ hồ sơ pháp lý"
                ],
                "requirements": [
                    "Tốt nghiệp Luật",
                    "Hiểu biết về luật BĐS",
                    "Cẩn thận, tỉ mỉ"
                ],
                "kpi": {"contract_turnaround": 2, "error_rate": 0}
            },
            {
                "code": "LC",
                "title": "Chuyên viên Pháp lý",
                "title_en": "Legal Counsel",
                "level": PositionLevel.SENIOR,
                "is_management": False,
                "salary_range": {"min": 18000000, "max": 30000000},
                "commission_eligible": False,
                "description": "Tư vấn pháp lý cho các giao dịch",
                "responsibilities": [
                    "Tư vấn pháp lý các deal",
                    "Đàm phán điều khoản hợp đồng",
                    "Xử lý tranh chấp",
                    "Rà soát pháp lý dự án"
                ],
                "requirements": [
                    "3+ năm kinh nghiệm pháp lý BĐS",
                    "Có thẻ luật sư (ưu tiên)",
                    "Kỹ năng đàm phán tốt"
                ],
                "kpi": {"legal_compliance": 100, "dispute_resolution": 95}
            },
            {
                "code": "LM",
                "title": "Trưởng phòng Pháp lý",
                "title_en": "Legal Manager",
                "level": PositionLevel.MANAGER,
                "is_management": True,
                "salary_range": {"min": 30000000, "max": 50000000},
                "commission_eligible": False,
                "description": "Quản lý toàn bộ công tác pháp lý",
                "responsibilities": [
                    "Xây dựng quy trình pháp lý",
                    "Quản lý team pháp lý",
                    "Đại diện công ty trong các vụ kiện",
                    "Tư vấn BOD về rủi ro pháp lý"
                ],
                "requirements": [
                    "5+ năm kinh nghiệm pháp lý",
                    "Có thẻ luật sư",
                    "Kinh nghiệm quản lý"
                ],
                "kpi": {"risk_mitigation": 100, "contract_compliance": 100}
            }
        ]
    },
    
    # === BACK OFFICE - ADMIN ===
    "admin": {
        "department": Department.ADMIN,
        "positions": [
            {
                "code": "AD",
                "title": "Nhân viên Hành chính",
                "title_en": "Admin Staff",
                "level": PositionLevel.JUNIOR,
                "is_management": False,
                "salary_range": {"min": 8000000, "max": 12000000},
                "commission_eligible": False,
                "description": "Thực hiện công việc hành chính văn phòng",
                "responsibilities": [
                    "Quản lý văn phòng phẩm",
                    "Đặt vé, khách sạn cho nhân viên",
                    "Tiếp khách, trực điện thoại",
                    "Hỗ trợ tổ chức sự kiện nội bộ"
                ],
                "requirements": [
                    "Tốt nghiệp CĐ/ĐH",
                    "Ngoại hình dễ nhìn",
                    "Thành thạo tin học văn phòng"
                ],
                "kpi": {"satisfaction_score": 90, "task_completion": 95}
            },
            {
                "code": "AM",
                "title": "Trưởng phòng Hành chính",
                "title_en": "Admin Manager",
                "level": PositionLevel.MANAGER,
                "is_management": True,
                "salary_range": {"min": 18000000, "max": 30000000},
                "commission_eligible": False,
                "description": "Quản lý toàn bộ công tác hành chính",
                "responsibilities": [
                    "Quản lý cơ sở vật chất",
                    "Quản lý nhân sự hành chính",
                    "Kiểm soát chi phí hành chính",
                    "Tổ chức sự kiện công ty"
                ],
                "requirements": [
                    "3+ năm kinh nghiệm hành chính",
                    "Khả năng quản lý tốt",
                    "Giao tiếp tốt"
                ],
                "kpi": {"cost_savings": 10, "facility_uptime": 99}
            }
        ]
    },
    
    # === BACK OFFICE - IT ===
    "it": {
        "department": Department.IT,
        "positions": [
            {
                "code": "ITS",
                "title": "Nhân viên IT Support",
                "title_en": "IT Support",
                "level": PositionLevel.JUNIOR,
                "is_management": False,
                "salary_range": {"min": 10000000, "max": 15000000},
                "commission_eligible": False,
                "description": "Hỗ trợ kỹ thuật cho nhân viên",
                "responsibilities": [
                    "Hỗ trợ phần cứng, phần mềm",
                    "Quản lý tài khoản, email",
                    "Bảo trì hệ thống mạng",
                    "Backup dữ liệu"
                ],
                "requirements": [
                    "Tốt nghiệp CNTT",
                    "Kiến thức về Windows, Network",
                    "Kỹ năng troubleshooting"
                ],
                "kpi": {"ticket_resolution_time": 4, "uptime": 99.5}
            },
            {
                "code": "DEV",
                "title": "Lập trình viên",
                "title_en": "Software Developer",
                "level": PositionLevel.SENIOR,
                "is_management": False,
                "salary_range": {"min": 20000000, "max": 40000000},
                "commission_eligible": False,
                "description": "Phát triển và bảo trì hệ thống nội bộ",
                "responsibilities": [
                    "Phát triển CRM, website",
                    "Bảo trì hệ thống",
                    "Tích hợp API",
                    "Code review"
                ],
                "requirements": [
                    "3+ năm kinh nghiệm lập trình",
                    "Python/JavaScript/React",
                    "Kinh nghiệm database"
                ],
                "kpi": {"features_delivered": 5, "bug_rate": 2}
            },
            {
                "code": "ITM",
                "title": "Trưởng phòng IT",
                "title_en": "IT Manager",
                "level": PositionLevel.MANAGER,
                "is_management": True,
                "salary_range": {"min": 30000000, "max": 50000000},
                "commission_eligible": False,
                "description": "Quản lý toàn bộ hệ thống IT",
                "responsibilities": [
                    "Hoạch định chiến lược IT",
                    "Quản lý team IT",
                    "Đảm bảo an ninh mạng",
                    "Triển khai dự án IT"
                ],
                "requirements": [
                    "5+ năm kinh nghiệm IT",
                    "Kinh nghiệm quản lý dự án",
                    "Kiến thức về security"
                ],
                "kpi": {"system_uptime": 99.9, "security_incidents": 0, "project_delivery": 95}
            }
        ]
    },
    
    # === MANAGEMENT ===
    "management": {
        "department": Department.MANAGEMENT,
        "positions": [
            {
                "code": "BM",
                "title": "Giám đốc Chi nhánh",
                "title_en": "Branch Manager",
                "level": PositionLevel.DIRECTOR,
                "is_management": True,
                "salary_range": {"min": 40000000, "max": 80000000},
                "commission_eligible": True,
                "description": "Điều hành toàn bộ hoạt động chi nhánh",
                "responsibilities": [
                    "Điều hành chi nhánh",
                    "Đạt target doanh số",
                    "Quản lý nhân sự chi nhánh",
                    "Phát triển thị trường"
                ],
                "requirements": [
                    "7+ năm kinh nghiệm ngành",
                    "5+ năm kinh nghiệm quản lý",
                    "Network khách hàng rộng"
                ],
                "kpi": {"branch_revenue": 100000000000, "profit_margin": 25, "market_share": 10}
            },
            {
                "code": "COO",
                "title": "Giám đốc Vận hành",
                "title_en": "Chief Operating Officer",
                "level": PositionLevel.VP,
                "is_management": True,
                "salary_range": {"min": 70000000, "max": 150000000},
                "commission_eligible": True,
                "description": "Điều hành toàn bộ hoạt động công ty",
                "responsibilities": [
                    "Vận hành toàn bộ công ty",
                    "Tối ưu quy trình",
                    "Quản lý các phòng ban",
                    "Tham gia BOD"
                ],
                "requirements": [
                    "15+ năm kinh nghiệm",
                    "10+ năm vị trí quản lý cấp cao",
                    "MBA"
                ],
                "kpi": {"operational_efficiency": 90, "cost_reduction": 15}
            },
            {
                "code": "CEO",
                "title": "Tổng Giám đốc",
                "title_en": "Chief Executive Officer",
                "level": PositionLevel.CEO,
                "is_management": True,
                "salary_range": {"min": 100000000, "max": 300000000},
                "commission_eligible": True,
                "description": "Điều hành toàn bộ công ty",
                "responsibilities": [
                    "Hoạch định chiến lược công ty",
                    "Đại diện pháp luật",
                    "Quan hệ cổ đông, đối tác",
                    "Quyết định các vấn đề quan trọng"
                ],
                "requirements": [
                    "20+ năm kinh nghiệm",
                    "Track record thành công",
                    "MBA từ trường uy tín"
                ],
                "kpi": {"revenue_growth": 30, "profit_growth": 25, "shareholder_value": 20}
            }
        ]
    }
}

# ==================== CONTRACT TEMPLATES - Mẫu Hợp đồng ====================

# Mẫu hợp đồng lao động theo Điều 21 BLLĐ 2019
CONTRACT_TEMPLATES = {
    "probation": {
        "name": "Hợp đồng Thử việc",
        "duration_months": 2,  # Tối đa 60 ngày cho nhân viên (Điều 25)
        "salary_percent": 85,  # Tối thiểu 85% lương chính thức (Điều 26)
        "required_clauses": [
            "Thông tin người lao động và người sử dụng lao động",
            "Vị trí công việc và nơi làm việc",
            "Thời gian thử việc",
            "Mức lương thử việc",
            "Điều kiện chấm dứt thử việc"
        ]
    },
    "fixed_term": {
        "name": "Hợp đồng Lao động Xác định Thời hạn",
        "max_duration_months": 36,  # Tối đa 36 tháng (Điều 20)
        "required_clauses": [
            "Thông tin người lao động và người sử dụng lao động",
            "Công việc và địa điểm làm việc",
            "Thời hạn hợp đồng",
            "Mức lương, phụ cấp, thưởng",
            "Thời giờ làm việc, nghỉ ngơi",
            "BHXH, BHYT, BHTN",
            "Đào tạo, bồi dưỡng",
            "Điều kiện chấm dứt HĐLĐ"
        ]
    },
    "indefinite": {
        "name": "Hợp đồng Lao động Không Xác định Thời hạn",
        "required_clauses": [
            "Thông tin người lao động và người sử dụng lao động",
            "Công việc và địa điểm làm việc",
            "Mức lương, phụ cấp, thưởng",
            "Thời giờ làm việc, nghỉ ngơi",
            "BHXH, BHYT, BHTN",
            "Đào tạo, bồi dưỡng",
            "Điều kiện chấm dứt HĐLĐ",
            "Thời hạn báo trước khi nghỉ việc"
        ],
        "notice_period_days": 45  # Điều 35
    }
}

# ==================== BENEFITS POLICY - Chính sách Phúc lợi ====================

BENEFITS_POLICY = {
    "insurance": {
        "social_insurance": {
            "employer_rate": 17.5,  # BHXH 17%, BHTN 0.5%
            "employee_rate": 8.0,   # BHXH 8%
            "description": "Bảo hiểm xã hội theo Luật BHXH 2014"
        },
        "health_insurance": {
            "employer_rate": 3.0,
            "employee_rate": 1.5,
            "description": "Bảo hiểm y tế theo Luật BHYT"
        },
        "unemployment_insurance": {
            "employer_rate": 1.0,
            "employee_rate": 1.0,
            "description": "Bảo hiểm thất nghiệp"
        }
    },
    "leave": {
        "annual_leave": {
            "days": 12,  # Điều 113 BLLĐ
            "description": "Phép năm (tăng 1 ngày/5 năm làm việc)",
            "carry_over": True
        },
        "sick_leave": {
            "days": 30,  # BHXH chi trả 75%
            "description": "Nghỉ ốm (có chứng từ y tế)"
        },
        "maternity_leave": {
            "days": 180,  # 6 tháng
            "description": "Thai sản nữ"
        },
        "paternity_leave": {
            "days": 7,  # Vợ sinh đôi: 10 ngày
            "description": "Nghỉ khi vợ sinh"
        },
        "wedding_leave": {
            "days": 3,
            "description": "Nghỉ cưới (bản thân)"
        },
        "funeral_leave": {
            "days": 3,
            "description": "Nghỉ tang (bố mẹ, vợ/chồng, con)"
        }
    },
    "allowances": {
        "lunch": {"amount": 730000, "description": "Phụ cấp ăn trưa/tháng"},
        "phone": {"amount": 500000, "description": "Phụ cấp điện thoại (Sales)"},
        "transport": {"amount": 500000, "description": "Phụ cấp xăng xe"},
        "housing": {"amount": 2000000, "description": "Phụ cấp nhà ở (theo vị trí)"},
        "toxic": {"amount": 0, "description": "Phụ cấp độc hại (nếu có)"}
    },
    "bonus": {
        "13th_salary": {"description": "Lương tháng 13 (theo hiệu suất)"},
        "tet_bonus": {"description": "Thưởng Tết (1-3 tháng lương)"},
        "quarter_bonus": {"description": "Thưởng quý (theo KPI)"},
        "referral_bonus": {"amount": 5000000, "description": "Thưởng giới thiệu nhân sự"}
    },
    "others": {
        "health_checkup": {"description": "Khám sức khỏe định kỳ"},
        "team_building": {"description": "Team building, du lịch hàng năm"},
        "birthday": {"amount": 500000, "description": "Quà sinh nhật"},
        "wedding_gift": {"amount": 2000000, "description": "Quà cưới"},
        "funeral_support": {"amount": 2000000, "description": "Phúng viếng tang"}
    }
}

# ==================== PYDANTIC MODELS ====================

class LaborContractCreate(BaseModel):
    """Tạo Hợp đồng Lao động"""
    employee_id: str
    contract_type: ContractType
    start_date: str
    end_date: Optional[str] = None
    position_id: str
    org_unit_id: str
    
    # Lương
    salary_type: SalaryType = SalaryType.GROSS
    base_salary: float
    allowances: Dict[str, float] = {}
    
    # Thời gian làm việc
    working_hours_per_week: int = 48  # Tối đa 48h/tuần
    working_days_per_week: int = 6
    
    # Thử việc
    probation_salary_percent: Optional[float] = None
    probation_end_date: Optional[str] = None
    
    # Điều khoản khác
    notice_period_days: int = 30
    non_compete_months: int = 0
    confidentiality_clause: bool = True
    
    notes: Optional[str] = None

class LaborContractResponse(BaseModel):
    """Response Hợp đồng Lao động"""
    id: str
    contract_number: str
    employee_id: str
    employee_name: str
    contract_type: ContractType
    status: str
    
    start_date: str
    end_date: Optional[str] = None
    
    position_id: str
    position_title: str
    org_unit_id: str
    org_unit_name: str
    
    salary_type: SalaryType
    base_salary: float
    allowances: Dict[str, float]
    total_salary: float
    
    # Các khoản trừ
    social_insurance: float = 0
    health_insurance: float = 0
    unemployment_insurance: float = 0
    personal_income_tax: float = 0
    net_salary: float = 0
    
    working_hours_per_week: int
    working_days_per_week: int
    
    probation_salary_percent: Optional[float] = None
    probation_end_date: Optional[str] = None
    
    notice_period_days: int
    
    signed_date: Optional[str] = None
    signed_by_employee: bool = False
    signed_by_employer: bool = False
    
    created_at: str
    updated_at: Optional[str] = None

class RecruitmentCreate(BaseModel):
    """Tạo Tin tuyển dụng"""
    title: str
    position_id: str
    org_unit_id: str
    quantity: int = 1
    
    job_description: str
    requirements: List[str]
    benefits: List[str]
    
    salary_range_min: Optional[float] = None
    salary_range_max: Optional[float] = None
    salary_negotiable: bool = True
    
    location: str
    work_type: str = "fulltime"  # fulltime, parttime, remote, hybrid
    
    deadline: Optional[str] = None
    interview_rounds: List[Dict[str, Any]] = []
    required_documents: List[str] = []
    
    is_published: bool = False

class RecruitmentResponse(BaseModel):
    """Response Tin tuyển dụng"""
    id: str
    code: str
    title: str
    position_id: str
    position_title: str
    org_unit_id: str
    org_unit_name: str
    quantity: int
    
    job_description: str
    requirements: List[str]
    benefits: List[str]
    
    salary_range_min: Optional[float] = None
    salary_range_max: Optional[float] = None
    salary_negotiable: bool
    
    location: str
    work_type: str
    
    status: RecruitmentStatus
    deadline: Optional[str] = None
    interview_rounds: List[Dict[str, Any]]
    required_documents: List[str]
    
    total_applications: int = 0
    shortlisted: int = 0
    hired: int = 0
    
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

class JobApplicationCreate(BaseModel):
    """Ứng tuyển công việc"""
    recruitment_id: str
    
    # Thông tin cá nhân
    full_name: str
    email: str
    phone: str
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    
    address: Optional[str] = None
    
    # CV và hồ sơ
    cv_url: Optional[str] = None
    cover_letter: Optional[str] = None
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    
    # Kinh nghiệm
    years_of_experience: int = 0
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    current_salary: Optional[float] = None
    expected_salary: Optional[float] = None
    
    # Học vấn
    education: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    
    # Câu hỏi sàng lọc
    screening_answers: Dict[str, Any] = {}
    
    # Nguồn
    source: str = "website"  # website, facebook, linkedin, referral
    referrer_employee_id: Optional[str] = None
    
    notes: Optional[str] = None

class JobApplicationResponse(BaseModel):
    """Response đơn ứng tuyển"""
    id: str
    application_code: str
    recruitment_id: str
    recruitment_title: str
    
    # Thông tin ứng viên
    full_name: str
    email: str
    phone: str
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    
    # Hồ sơ
    cv_url: Optional[str] = None
    cover_letter: Optional[str] = None
    
    # Trạng thái
    status: ApplicationStatus
    current_round: Optional[str] = None
    
    # Điểm đánh giá
    screening_score: Optional[float] = None
    interview_scores: Dict[str, float] = {}
    overall_score: Optional[float] = None
    
    # Timeline
    submitted_at: str
    screened_at: Optional[str] = None
    interviewed_at: Optional[str] = None
    offered_at: Optional[str] = None
    hired_at: Optional[str] = None
    
    assigned_recruiter: Optional[str] = None
    notes: Optional[str] = None

class TrainingCourseCreate(BaseModel):
    """Tạo khóa đào tạo"""
    title: str
    code: str
    type: TrainingType
    description: str
    
    # Đối tượng
    target_departments: List[str] = []
    target_positions: List[str] = []
    is_mandatory: bool = False
    
    # Nội dung
    modules: List[Dict[str, Any]] = []
    total_hours: float = 0
    passing_score: float = 70
    
    # Video/Tài liệu
    video_urls: List[str] = []
    document_urls: List[str] = []
    
    # Quiz
    has_quiz: bool = True
    quiz_questions: List[Dict[str, Any]] = []
    
    # Chứng chỉ
    certificate_template: Optional[str] = None
    validity_months: Optional[int] = None  # Thời hạn chứng chỉ

class TrainingCourseResponse(BaseModel):
    """Response khóa đào tạo"""
    id: str
    title: str
    code: str
    type: TrainingType
    description: str
    
    target_departments: List[str]
    target_positions: List[str]
    is_mandatory: bool
    
    modules: List[Dict[str, Any]]
    total_hours: float
    passing_score: float
    
    video_urls: List[str]
    document_urls: List[str]
    
    has_quiz: bool
    quiz_questions_count: int = 0
    
    total_enrolled: int = 0
    total_completed: int = 0
    average_score: float = 0
    
    is_active: bool = True
    created_at: str

class EmployeeTrainingCreate(BaseModel):
    """Ghi danh nhân viên vào khóa đào tạo"""
    employee_id: str
    course_id: str
    due_date: Optional[str] = None

class EmployeeTrainingResponse(BaseModel):
    """Response tiến độ đào tạo"""
    id: str
    employee_id: str
    employee_name: str
    course_id: str
    course_title: str
    course_type: TrainingType
    
    status: TrainingStatus
    progress_percent: float = 0
    
    # Chi tiết module
    completed_modules: List[str] = []
    
    # Quiz
    quiz_attempts: int = 0
    quiz_score: Optional[float] = None
    quiz_passed: bool = False
    
    # Thời gian
    enrolled_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    due_date: Optional[str] = None
    
    # Chứng chỉ
    certificate_id: Optional[str] = None
    certificate_url: Optional[str] = None
    certificate_expires_at: Optional[str] = None

class InternalMessageCreate(BaseModel):
    """Tin nhắn nội bộ"""
    to_user_id: Optional[str] = None  # Nhắn cho 1 người
    to_channel_id: Optional[str] = None  # Nhắn vào channel
    content: str
    attachments: List[str] = []
    reply_to_id: Optional[str] = None

class InternalMessageResponse(BaseModel):
    """Response tin nhắn"""
    id: str
    from_user_id: str
    from_user_name: str
    from_user_avatar: Optional[str] = None
    
    to_user_id: Optional[str] = None
    to_user_name: Optional[str] = None
    to_channel_id: Optional[str] = None
    to_channel_name: Optional[str] = None
    
    content: str
    attachments: List[str] = []
    
    reply_to_id: Optional[str] = None
    
    is_read: bool = False
    read_at: Optional[str] = None
    
    created_at: str

class MessageChannelCreate(BaseModel):
    """Tạo kênh chat"""
    name: str
    type: str = "public"  # public, private, department
    description: Optional[str] = None
    member_ids: List[str] = []
    org_unit_id: Optional[str] = None

class MessageChannelResponse(BaseModel):
    """Response kênh chat"""
    id: str
    name: str
    type: str
    description: Optional[str] = None
    
    member_count: int = 0
    last_message_at: Optional[str] = None
    unread_count: int = 0
    
    created_by: str
    created_at: str

class KPICreate(BaseModel):
    """Tạo KPI cho nhân viên"""
    employee_id: str
    period_year: int
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    
    targets: List[Dict[str, Any]] = []  # [{name, target, unit, weight}]

class KPIResponse(BaseModel):
    """Response KPI"""
    id: str
    employee_id: str
    employee_name: str
    position_title: str
    
    period_year: int
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    
    targets: List[Dict[str, Any]] = []
    results: List[Dict[str, Any]] = []
    
    total_score: float = 0
    rating: str = ""  # A, B, C, D
    
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    
    created_at: str

class DisciplineRecordCreate(BaseModel):
    """Tạo hồ sơ kỷ luật"""
    employee_id: str
    type: DisciplineType
    reason: str
    evidence_urls: List[str] = []
    effective_date: str
    duration_months: Optional[int] = None  # Cho loại kéo dài nâng lương

class DisciplineRecordResponse(BaseModel):
    """Response hồ sơ kỷ luật"""
    id: str
    employee_id: str
    employee_name: str
    
    type: DisciplineType
    reason: str
    evidence_urls: List[str]
    
    effective_date: str
    end_date: Optional[str] = None
    
    issued_by: str
    issued_by_name: str
    
    is_active: bool = True
    created_at: str

class RewardRecordCreate(BaseModel):
    """Tạo hồ sơ khen thưởng"""
    employee_id: str
    type: RewardType
    reason: str
    amount: Optional[float] = None
    effective_date: str

class RewardRecordResponse(BaseModel):
    """Response hồ sơ khen thưởng"""
    id: str
    employee_id: str
    employee_name: str
    
    type: RewardType
    reason: str
    amount: Optional[float] = None
    
    effective_date: str
    
    issued_by: str
    issued_by_name: str
    
    created_at: str

class CareerPathResponse(BaseModel):
    """Lộ trình phát triển nghề nghiệp"""
    employee_id: str
    employee_name: str
    current_position: str
    current_level: str
    tenure_months: int
    
    # Lộ trình gợi ý
    next_positions: List[Dict[str, Any]] = []  # [{position, requirements, timeline}]
    required_trainings: List[Dict[str, Any]] = []
    required_experience: List[str] = []
    
    # Tiến độ hiện tại
    completed_trainings: List[str] = []
    achievements: List[str] = []
    mentor_id: Optional[str] = None
    mentor_name: Optional[str] = None

class CompanyCultureResponse(BaseModel):
    """Văn hóa doanh nghiệp"""
    id: str
    company_name: str
    
    # Core values
    mission: str
    vision: str
    core_values: List[Dict[str, str]] = []  # [{name, description}]
    
    # Handbook
    handbook_url: Optional[str] = None
    code_of_conduct: List[str] = []
    dress_code: str = ""
    
    # Policies
    policies: List[Dict[str, Any]] = []
    
    updated_at: str
