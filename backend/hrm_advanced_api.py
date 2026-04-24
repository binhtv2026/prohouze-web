"""
ProHouzing HRM Advanced API
APIs cho Module Nhân sự Nâng cao
"""

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from hrm_advanced_models import (
    # Enums
    ContractType, SalaryType, EmployeeStatus, Department, PositionLevel,
    RecruitmentStatus, ApplicationStatus, TrainingType, TrainingStatus,
    LeaveType, DisciplineType, RewardType,
    # Catalogs
    POSITION_CATALOG, CONTRACT_TEMPLATES, BENEFITS_POLICY,
    # Models
    LaborContractCreate, LaborContractResponse,
    RecruitmentCreate, RecruitmentResponse,
    JobApplicationCreate, JobApplicationResponse,
    TrainingCourseCreate, TrainingCourseResponse,
    EmployeeTrainingCreate, EmployeeTrainingResponse,
    InternalMessageCreate, InternalMessageResponse,
    MessageChannelCreate, MessageChannelResponse,
    KPICreate, KPIResponse,
    DisciplineRecordCreate, DisciplineRecordResponse,
    RewardRecordCreate, RewardRecordResponse,
    CareerPathResponse, CompanyCultureResponse
)

hrm_advanced_router = APIRouter(prefix="/hrm-advanced", tags=["HRM Advanced"])

# Import db from server
from server import db, get_current_user, get_user_name

# ==================== POSITION CATALOG APIs ====================

@hrm_advanced_router.get("/position-catalog")
async def get_position_catalog():
    """Lấy danh mục chức danh chuẩn"""
    return POSITION_CATALOG

@hrm_advanced_router.get("/position-catalog/{department}")
async def get_positions_by_department(department: str):
    """Lấy danh sách chức danh theo phòng ban"""
    if department not in POSITION_CATALOG:
        raise HTTPException(status_code=404, detail="Department not found")
    return POSITION_CATALOG[department]

# ==================== CONTRACT TEMPLATES APIs ====================

@hrm_advanced_router.get("/contract-templates")
async def get_contract_templates():
    """Lấy mẫu hợp đồng lao động"""
    return CONTRACT_TEMPLATES

@hrm_advanced_router.get("/benefits-policy")
async def get_benefits_policy():
    """Lấy chính sách phúc lợi"""
    return BENEFITS_POLICY

# ==================== LABOR CONTRACT APIs ====================

@hrm_advanced_router.post("/contracts", response_model=LaborContractResponse)
async def create_labor_contract(
    data: LaborContractCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo hợp đồng lao động mới"""
    if current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    contract_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate contract number
    year = datetime.now().year
    count = await db.labor_contracts.count_documents({"created_year": year})
    contract_number = f"HDLD-{year}-{count + 1:04d}"
    
    # Get employee info
    employee = await db.users.find_one({"id": data.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get position info
    position = await db.job_positions.find_one({"id": data.position_id}, {"_id": 0})
    position_title = position["title"] if position else "N/A"
    
    # Get org unit info
    org_unit = await db.org_units.find_one({"id": data.org_unit_id}, {"_id": 0})
    org_unit_name = org_unit["name"] if org_unit else "N/A"
    
    # Calculate salary components
    total_allowances = sum(data.allowances.values())
    total_salary = data.base_salary + total_allowances
    
    # Calculate deductions (BHXH, BHYT, BHTN, PIT)
    # Mức đóng theo quy định 2024
    social_insurance = data.base_salary * 0.08  # 8%
    health_insurance = data.base_salary * 0.015  # 1.5%
    unemployment_insurance = data.base_salary * 0.01  # 1%
    
    # Simplified PIT calculation (need actual formula)
    taxable_income = total_salary - social_insurance - health_insurance - unemployment_insurance - 11000000  # Giảm trừ bản thân
    if taxable_income < 0:
        taxable_income = 0
    
    # Progressive tax (simplified)
    pit = 0
    if taxable_income > 0:
        if taxable_income <= 5000000:
            pit = taxable_income * 0.05
        elif taxable_income <= 10000000:
            pit = 250000 + (taxable_income - 5000000) * 0.10
        elif taxable_income <= 18000000:
            pit = 750000 + (taxable_income - 10000000) * 0.15
        elif taxable_income <= 32000000:
            pit = 1950000 + (taxable_income - 18000000) * 0.20
        elif taxable_income <= 52000000:
            pit = 4750000 + (taxable_income - 32000000) * 0.25
        elif taxable_income <= 80000000:
            pit = 9750000 + (taxable_income - 52000000) * 0.30
        else:
            pit = 18150000 + (taxable_income - 80000000) * 0.35
    
    net_salary = total_salary - social_insurance - health_insurance - unemployment_insurance - pit
    
    contract_doc = {
        "id": contract_id,
        "contract_number": contract_number,
        "employee_id": data.employee_id,
        "employee_name": employee["full_name"],
        "contract_type": data.contract_type.value,
        "status": "draft",
        
        "start_date": data.start_date,
        "end_date": data.end_date,
        
        "position_id": data.position_id,
        "position_title": position_title,
        "org_unit_id": data.org_unit_id,
        "org_unit_name": org_unit_name,
        
        "salary_type": data.salary_type.value,
        "base_salary": data.base_salary,
        "allowances": data.allowances,
        "total_salary": total_salary,
        
        "social_insurance": social_insurance,
        "health_insurance": health_insurance,
        "unemployment_insurance": unemployment_insurance,
        "personal_income_tax": pit,
        "net_salary": net_salary,
        
        "working_hours_per_week": data.working_hours_per_week,
        "working_days_per_week": data.working_days_per_week,
        
        "probation_salary_percent": data.probation_salary_percent,
        "probation_end_date": data.probation_end_date,
        
        "notice_period_days": data.notice_period_days,
        "non_compete_months": data.non_compete_months,
        "confidentiality_clause": data.confidentiality_clause,
        
        "signed_date": None,
        "signed_by_employee": False,
        "signed_by_employer": False,
        
        "notes": data.notes,
        "created_by": current_user["id"],
        "created_at": now,
        "created_year": year,
        "updated_at": None
    }
    
    await db.labor_contracts.insert_one(contract_doc)
    return LaborContractResponse(**contract_doc)

@hrm_advanced_router.get("/contracts", response_model=List[LaborContractResponse])
async def get_labor_contracts(
    employee_id: Optional[str] = None,
    contract_type: Optional[ContractType] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách hợp đồng lao động"""
    if current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if contract_type:
        query["contract_type"] = contract_type.value
    if status:
        query["status"] = status
    
    contracts = await db.labor_contracts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [LaborContractResponse(**c) for c in contracts]

@hrm_advanced_router.get("/contracts/{contract_id}", response_model=LaborContractResponse)
async def get_labor_contract(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy chi tiết hợp đồng lao động"""
    contract = await db.labor_contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check permission
    if current_user["role"] not in ["bod", "admin", "hr"] and contract["employee_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return LaborContractResponse(**contract)

@hrm_advanced_router.post("/contracts/{contract_id}/sign")
async def sign_contract(
    contract_id: str,
    signer_type: str = Query(..., description="employee or employer"),
    current_user: dict = Depends(get_current_user)
):
    """Ký hợp đồng"""
    contract = await db.labor_contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update = {}
    
    if signer_type == "employee":
        if contract["employee_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only employee can sign as employee")
        update["signed_by_employee"] = True
    elif signer_type == "employer":
        if current_user["role"] not in ["bod", "admin", "hr"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        update["signed_by_employer"] = True
    
    # Check if both signed
    contract.update(update)
    if contract.get("signed_by_employee") and contract.get("signed_by_employer"):
        update["status"] = "active"
        update["signed_date"] = now
    
    update["updated_at"] = now
    
    await db.labor_contracts.update_one({"id": contract_id}, {"$set": update})
    
    return {"success": True, "status": update.get("status", contract["status"])}

# ==================== RECRUITMENT APIs ====================

@hrm_advanced_router.post("/recruitments", response_model=RecruitmentResponse)
async def create_recruitment(
    data: RecruitmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo tin tuyển dụng"""
    if current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    recruitment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate code
    count = await db.recruitments.count_documents({})
    code = f"JOB-{count + 1:04d}"
    
    # Get position info
    position = await db.job_positions.find_one({"id": data.position_id}, {"_id": 0})
    position_title = position["title"] if position else "N/A"
    
    # Get org unit info
    org_unit = await db.org_units.find_one({"id": data.org_unit_id}, {"_id": 0})
    org_unit_name = org_unit["name"] if org_unit else "N/A"
    
    recruitment_doc = {
        "id": recruitment_id,
        "code": code,
        "title": data.title,
        "position_id": data.position_id,
        "position_title": position_title,
        "org_unit_id": data.org_unit_id,
        "org_unit_name": org_unit_name,
        "quantity": data.quantity,
        
        "job_description": data.job_description,
        "requirements": data.requirements,
        "benefits": data.benefits,
        
        "salary_range_min": data.salary_range_min,
        "salary_range_max": data.salary_range_max,
        "salary_negotiable": data.salary_negotiable,
        
        "location": data.location,
        "work_type": data.work_type,
        
        "status": RecruitmentStatus.DRAFT.value if not data.is_published else RecruitmentStatus.OPEN.value,
        "deadline": data.deadline,
        "interview_rounds": data.interview_rounds or [
            {"round": 1, "name": "Sàng lọc CV", "type": "screening"},
            {"round": 2, "name": "Phỏng vấn HR", "type": "interview_hr"},
            {"round": 3, "name": "Phỏng vấn Chuyên môn", "type": "interview_tech"},
            {"round": 4, "name": "Làm bài test", "type": "assessment"},
            {"round": 5, "name": "Phỏng vấn Manager", "type": "interview_manager"}
        ],
        "required_documents": data.required_documents or ["CV", "Bằng cấp", "CMND/CCCD"],
        
        "total_applications": 0,
        "shortlisted": 0,
        "hired": 0,
        
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": None
    }
    
    await db.recruitments.insert_one(recruitment_doc)
    return RecruitmentResponse(**recruitment_doc)

@hrm_advanced_router.get("/recruitments", response_model=List[RecruitmentResponse])
async def get_recruitments(
    status: Optional[RecruitmentStatus] = None,
    is_public: bool = False,
    current_user: dict = Depends(get_current_user) if not None else None
):
    """Lấy danh sách tin tuyển dụng"""
    query = {}
    if status:
        query["status"] = status.value
    
    # Public API cho ứng viên
    if is_public:
        query["status"] = RecruitmentStatus.OPEN.value
    
    recruitments = await db.recruitments.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [RecruitmentResponse(**r) for r in recruitments]

@hrm_advanced_router.get("/recruitments/public", response_model=List[RecruitmentResponse])
async def get_public_recruitments():
    """API công khai - Lấy tin tuyển dụng đang mở (không cần đăng nhập)"""
    query = {"status": RecruitmentStatus.OPEN.value}
    recruitments = await db.recruitments.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [RecruitmentResponse(**r) for r in recruitments]

@hrm_advanced_router.get("/recruitments/{recruitment_id}", response_model=RecruitmentResponse)
async def get_recruitment(recruitment_id: str):
    """Lấy chi tiết tin tuyển dụng (công khai)"""
    recruitment = await db.recruitments.find_one({"id": recruitment_id}, {"_id": 0})
    if not recruitment:
        raise HTTPException(status_code=404, detail="Recruitment not found")
    return RecruitmentResponse(**recruitment)

# ==================== JOB APPLICATION APIs ====================

@hrm_advanced_router.post("/applications", response_model=JobApplicationResponse)
async def submit_application(data: JobApplicationCreate):
    """Nộp đơn ứng tuyển (không cần đăng nhập)"""
    application_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Check recruitment exists and is open
    recruitment = await db.recruitments.find_one({"id": data.recruitment_id}, {"_id": 0})
    if not recruitment:
        raise HTTPException(status_code=404, detail="Recruitment not found")
    if recruitment["status"] != RecruitmentStatus.OPEN.value:
        raise HTTPException(status_code=400, detail="Recruitment is closed")
    
    # Check duplicate
    existing = await db.job_applications.find_one({
        "recruitment_id": data.recruitment_id,
        "email": data.email
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this position")
    
    # Generate application code
    count = await db.job_applications.count_documents({})
    application_code = f"APP-{count + 1:06d}"
    
    application_doc = {
        "id": application_id,
        "application_code": application_code,
        "recruitment_id": data.recruitment_id,
        "recruitment_title": recruitment["title"],
        
        # Personal info
        "full_name": data.full_name,
        "email": data.email,
        "phone": data.phone,
        "gender": data.gender,
        "date_of_birth": data.date_of_birth,
        "address": data.address,
        
        # Documents
        "cv_url": data.cv_url,
        "cover_letter": data.cover_letter,
        "portfolio_url": data.portfolio_url,
        "linkedin_url": data.linkedin_url,
        
        # Experience
        "years_of_experience": data.years_of_experience,
        "current_company": data.current_company,
        "current_position": data.current_position,
        "current_salary": data.current_salary,
        "expected_salary": data.expected_salary,
        
        # Education
        "education": data.education,
        "certifications": data.certifications,
        
        # Screening
        "screening_answers": data.screening_answers,
        
        # Source
        "source": data.source,
        "referrer_employee_id": data.referrer_employee_id,
        
        # Status
        "status": ApplicationStatus.SUBMITTED.value,
        "current_round": None,
        
        # Scores
        "screening_score": None,
        "interview_scores": {},
        "overall_score": None,
        
        # Timeline
        "submitted_at": now,
        "screened_at": None,
        "interviewed_at": None,
        "offered_at": None,
        "hired_at": None,
        
        "assigned_recruiter": None,
        "notes": data.notes
    }
    
    await db.job_applications.insert_one(application_doc)
    
    # Update recruitment stats
    await db.recruitments.update_one(
        {"id": data.recruitment_id},
        {"$inc": {"total_applications": 1}}
    )
    
    return JobApplicationResponse(**application_doc)

@hrm_advanced_router.get("/applications", response_model=List[JobApplicationResponse])
async def get_applications(
    recruitment_id: Optional[str] = None,
    status: Optional[ApplicationStatus] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách đơn ứng tuyển"""
    if current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if recruitment_id:
        query["recruitment_id"] = recruitment_id
    if status:
        query["status"] = status.value
    
    applications = await db.job_applications.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    return [JobApplicationResponse(**a) for a in applications]

@hrm_advanced_router.get("/applications/{application_id}", response_model=JobApplicationResponse)
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy chi tiết đơn ứng tuyển"""
    if current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    application = await db.job_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return JobApplicationResponse(**application)

@hrm_advanced_router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status: ApplicationStatus,
    score: Optional[float] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật trạng thái đơn ứng tuyển"""
    if current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    application = await db.job_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update = {"status": status.value}
    
    # Update timeline based on status
    if status == ApplicationStatus.SCREENING:
        update["screened_at"] = now
        if score:
            update["screening_score"] = score
    elif status in [ApplicationStatus.INTERVIEW_HR, ApplicationStatus.INTERVIEW_TECH, ApplicationStatus.INTERVIEW_MANAGER]:
        update["interviewed_at"] = now
        update["current_round"] = status.value
        if score:
            update[f"interview_scores.{status.value}"] = score
    elif status == ApplicationStatus.OFFER:
        update["offered_at"] = now
    elif status == ApplicationStatus.ACCEPTED:
        update["hired_at"] = now
        # Update recruitment stats
        await db.recruitments.update_one(
            {"id": application["recruitment_id"]},
            {"$inc": {"hired": 1}}
        )
    
    if notes:
        update["notes"] = notes
    
    await db.job_applications.update_one({"id": application_id}, {"$set": update})
    
    return {"success": True, "status": status.value}

# ==================== TRAINING APIs ====================

@hrm_advanced_router.post("/training/courses", response_model=TrainingCourseResponse)
async def create_training_course(
    data: TrainingCourseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo khóa đào tạo"""
    if current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    course_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    course_doc = {
        "id": course_id,
        "title": data.title,
        "code": data.code,
        "type": data.type.value,
        "description": data.description,
        
        "target_departments": data.target_departments,
        "target_positions": data.target_positions,
        "is_mandatory": data.is_mandatory,
        
        "modules": data.modules,
        "total_hours": data.total_hours,
        "passing_score": data.passing_score,
        
        "video_urls": data.video_urls,
        "document_urls": data.document_urls,
        
        "has_quiz": data.has_quiz,
        "quiz_questions": data.quiz_questions,
        "quiz_questions_count": len(data.quiz_questions),
        
        "certificate_template": data.certificate_template,
        "validity_months": data.validity_months,
        
        "total_enrolled": 0,
        "total_completed": 0,
        "average_score": 0,
        
        "is_active": True,
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.training_courses.insert_one(course_doc)
    return TrainingCourseResponse(**course_doc)

@hrm_advanced_router.get("/training/courses", response_model=List[TrainingCourseResponse])
async def get_training_courses(
    type: Optional[TrainingType] = None,
    is_mandatory: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách khóa đào tạo"""
    query = {"is_active": True}
    if type:
        query["type"] = type.value
    if is_mandatory is not None:
        query["is_mandatory"] = is_mandatory
    
    courses = await db.training_courses.find(query, {"_id": 0}).to_list(100)
    return [TrainingCourseResponse(**c) for c in courses]

@hrm_advanced_router.post("/training/enroll", response_model=EmployeeTrainingResponse)
async def enroll_training(
    data: EmployeeTrainingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Ghi danh nhân viên vào khóa đào tạo"""
    if current_user["role"] not in ["bod", "admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check course exists
    course = await db.training_courses.find_one({"id": data.course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check employee exists
    employee = await db.users.find_one({"id": data.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check already enrolled
    existing = await db.employee_trainings.find_one({
        "employee_id": data.employee_id,
        "course_id": data.course_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Employee already enrolled")
    
    enrollment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    enrollment_doc = {
        "id": enrollment_id,
        "employee_id": data.employee_id,
        "employee_name": employee["full_name"],
        "course_id": data.course_id,
        "course_title": course["title"],
        "course_type": course["type"],
        
        "status": TrainingStatus.NOT_STARTED.value,
        "progress_percent": 0,
        
        "completed_modules": [],
        
        "quiz_attempts": 0,
        "quiz_score": None,
        "quiz_passed": False,
        
        "enrolled_at": now,
        "started_at": None,
        "completed_at": None,
        "due_date": data.due_date,
        
        "certificate_id": None,
        "certificate_url": None,
        "certificate_expires_at": None
    }
    
    await db.employee_trainings.insert_one(enrollment_doc)
    
    # Update course stats
    await db.training_courses.update_one(
        {"id": data.course_id},
        {"$inc": {"total_enrolled": 1}}
    )
    
    return EmployeeTrainingResponse(**enrollment_doc)

@hrm_advanced_router.get("/training/my-courses", response_model=List[EmployeeTrainingResponse])
async def get_my_training_courses(
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách khóa học của tôi"""
    enrollments = await db.employee_trainings.find(
        {"employee_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    return [EmployeeTrainingResponse(**e) for e in enrollments]

@hrm_advanced_router.put("/training/progress/{enrollment_id}")
async def update_training_progress(
    enrollment_id: str,
    completed_module: Optional[str] = None,
    quiz_score: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật tiến độ đào tạo"""
    enrollment = await db.employee_trainings.find_one({"id": enrollment_id}, {"_id": 0})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if enrollment["employee_id"] != current_user["id"] and current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    now = datetime.now(timezone.utc).isoformat()
    update = {}
    
    # Mark started if first action
    if enrollment["status"] == TrainingStatus.NOT_STARTED.value:
        update["status"] = TrainingStatus.IN_PROGRESS.value
        update["started_at"] = now
    
    # Add completed module
    if completed_module:
        update["$addToSet"] = {"completed_modules": completed_module}
        
        # Calculate progress
        course = await db.training_courses.find_one({"id": enrollment["course_id"]}, {"_id": 0})
        total_modules = len(course.get("modules", []))
        completed_count = len(enrollment.get("completed_modules", [])) + 1
        progress = (completed_count / total_modules * 100) if total_modules > 0 else 0
        update["progress_percent"] = min(progress, 100)
    
    # Update quiz score
    if quiz_score is not None:
        update["quiz_score"] = quiz_score
        update["$inc"] = {"quiz_attempts": 1}
        
        course = await db.training_courses.find_one({"id": enrollment["course_id"]}, {"_id": 0})
        if quiz_score >= course.get("passing_score", 70):
            update["quiz_passed"] = True
            update["status"] = TrainingStatus.COMPLETED.value
            update["completed_at"] = now
            
            # Generate certificate
            certificate_id = str(uuid.uuid4())
            update["certificate_id"] = certificate_id
            
            # Update course stats
            await db.training_courses.update_one(
                {"id": enrollment["course_id"]},
                {"$inc": {"total_completed": 1}}
            )
    
    await db.employee_trainings.update_one({"id": enrollment_id}, {"$set": update} if "$addToSet" not in update else update)
    
    return {"success": True}

# ==================== INTERNAL MESSAGING APIs ====================

@hrm_advanced_router.post("/messages/channels", response_model=MessageChannelResponse)
async def create_message_channel(
    data: MessageChannelCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo kênh chat"""
    channel_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    channel_doc = {
        "id": channel_id,
        "name": data.name,
        "type": data.type,
        "description": data.description,
        "member_ids": data.member_ids + [current_user["id"]],
        "org_unit_id": data.org_unit_id,
        "member_count": len(data.member_ids) + 1,
        "last_message_at": None,
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.message_channels.insert_one(channel_doc)
    return MessageChannelResponse(**channel_doc, unread_count=0)

@hrm_advanced_router.get("/messages/channels", response_model=List[MessageChannelResponse])
async def get_message_channels(
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách kênh chat"""
    # Get channels user is member of
    channels = await db.message_channels.find(
        {"$or": [
            {"member_ids": current_user["id"]},
            {"type": "public"}
        ]},
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for ch in channels:
        # Count unread
        unread = await db.messages.count_documents({
            "to_channel_id": ch["id"],
            "is_read": False,
            "from_user_id": {"$ne": current_user["id"]}
        })
        result.append(MessageChannelResponse(**ch, unread_count=unread))
    
    return result

@hrm_advanced_router.post("/messages", response_model=InternalMessageResponse)
async def send_message(
    data: InternalMessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Gửi tin nhắn"""
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get receiver info
    to_user_name = None
    to_channel_name = None
    
    if data.to_user_id:
        to_user = await db.users.find_one({"id": data.to_user_id}, {"_id": 0, "full_name": 1})
        to_user_name = to_user["full_name"] if to_user else None
    
    if data.to_channel_id:
        channel = await db.message_channels.find_one({"id": data.to_channel_id}, {"_id": 0, "name": 1})
        to_channel_name = channel["name"] if channel else None
        # Update last message time
        await db.message_channels.update_one(
            {"id": data.to_channel_id},
            {"$set": {"last_message_at": now}}
        )
    
    message_doc = {
        "id": message_id,
        "from_user_id": current_user["id"],
        "from_user_name": current_user["full_name"],
        "from_user_avatar": current_user.get("avatar"),
        
        "to_user_id": data.to_user_id,
        "to_user_name": to_user_name,
        "to_channel_id": data.to_channel_id,
        "to_channel_name": to_channel_name,
        
        "content": data.content,
        "attachments": data.attachments,
        
        "reply_to_id": data.reply_to_id,
        
        "is_read": False,
        "read_at": None,
        
        "created_at": now
    }
    
    await db.messages.insert_one(message_doc)
    return InternalMessageResponse(**message_doc)

@hrm_advanced_router.get("/messages", response_model=List[InternalMessageResponse])
async def get_messages(
    user_id: Optional[str] = None,
    channel_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy tin nhắn"""
    query = {}
    
    if channel_id:
        query["to_channel_id"] = channel_id
    elif user_id:
        # Conversation between current user and another user
        query["$or"] = [
            {"from_user_id": current_user["id"], "to_user_id": user_id},
            {"from_user_id": user_id, "to_user_id": current_user["id"]}
        ]
    else:
        # All direct messages for current user
        query["$or"] = [
            {"from_user_id": current_user["id"], "to_channel_id": None},
            {"to_user_id": current_user["id"]}
        ]
    
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Mark as read
    if user_id:
        await db.messages.update_many(
            {"from_user_id": user_id, "to_user_id": current_user["id"], "is_read": False},
            {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return [InternalMessageResponse(**m) for m in reversed(messages)]

# ==================== KPI APIs ====================

@hrm_advanced_router.post("/kpi", response_model=KPIResponse)
async def create_kpi(
    data: KPICreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo KPI cho nhân viên"""
    if current_user["role"] not in ["bod", "admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    kpi_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get employee info
    employee = await db.users.find_one({"id": data.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get position
    profile = await db.employee_profiles.find_one({"user_id": data.employee_id}, {"_id": 0})
    position_title = profile.get("position_title", "N/A") if profile else "N/A"
    
    kpi_doc = {
        "id": kpi_id,
        "employee_id": data.employee_id,
        "employee_name": employee["full_name"],
        "position_title": position_title,
        
        "period_year": data.period_year,
        "period_month": data.period_month,
        "period_quarter": data.period_quarter,
        
        "targets": data.targets,
        "results": [],
        
        "total_score": 0,
        "rating": "",
        
        "approved_by": None,
        "approved_at": None,
        
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.kpis.insert_one(kpi_doc)
    return KPIResponse(**kpi_doc)

@hrm_advanced_router.get("/kpi", response_model=List[KPIResponse])
async def get_kpis(
    employee_id: Optional[str] = None,
    period_year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách KPI"""
    query = {}
    
    # Filter by permission
    if current_user["role"] == "sales":
        query["employee_id"] = current_user["id"]
    elif employee_id:
        query["employee_id"] = employee_id
    
    if period_year:
        query["period_year"] = period_year
    
    kpis = await db.kpis.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [KPIResponse(**k) for k in kpis]

# ==================== DISCIPLINE & REWARD APIs ====================

@hrm_advanced_router.post("/discipline", response_model=DisciplineRecordResponse)
async def create_discipline_record(
    data: DisciplineRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo hồ sơ kỷ luật"""
    if current_user["role"] not in ["bod", "admin", "hr"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    record_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get employee info
    employee = await db.users.find_one({"id": data.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate end date for time-limited disciplines
    end_date = None
    if data.duration_months and data.type == DisciplineType.DEMOTION:
        from dateutil.relativedelta import relativedelta
        start = datetime.fromisoformat(data.effective_date)
        end_date = (start + relativedelta(months=data.duration_months)).isoformat()
    
    record_doc = {
        "id": record_id,
        "employee_id": data.employee_id,
        "employee_name": employee["full_name"],
        
        "type": data.type.value,
        "reason": data.reason,
        "evidence_urls": data.evidence_urls,
        
        "effective_date": data.effective_date,
        "end_date": end_date,
        
        "issued_by": current_user["id"],
        "issued_by_name": current_user["full_name"],
        
        "is_active": True,
        "created_at": now
    }
    
    await db.discipline_records.insert_one(record_doc)
    return DisciplineRecordResponse(**record_doc)

@hrm_advanced_router.post("/rewards", response_model=RewardRecordResponse)
async def create_reward_record(
    data: RewardRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo hồ sơ khen thưởng"""
    if current_user["role"] not in ["bod", "admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    record_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get employee info
    employee = await db.users.find_one({"id": data.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    record_doc = {
        "id": record_id,
        "employee_id": data.employee_id,
        "employee_name": employee["full_name"],
        
        "type": data.type.value,
        "reason": data.reason,
        "amount": data.amount,
        
        "effective_date": data.effective_date,
        
        "issued_by": current_user["id"],
        "issued_by_name": current_user["full_name"],
        
        "created_at": now
    }
    
    await db.reward_records.insert_one(record_doc)
    return RewardRecordResponse(**record_doc)

@hrm_advanced_router.get("/discipline/{employee_id}", response_model=List[DisciplineRecordResponse])
async def get_discipline_records(
    employee_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy hồ sơ kỷ luật của nhân viên"""
    if current_user["role"] not in ["bod", "admin", "hr"] and current_user["id"] != employee_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    records = await db.discipline_records.find({"employee_id": employee_id}, {"_id": 0}).to_list(100)
    return [DisciplineRecordResponse(**r) for r in records]

@hrm_advanced_router.get("/rewards/{employee_id}", response_model=List[RewardRecordResponse])
async def get_reward_records(
    employee_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy hồ sơ khen thưởng của nhân viên"""
    records = await db.reward_records.find({"employee_id": employee_id}, {"_id": 0}).to_list(100)
    return [RewardRecordResponse(**r) for r in records]

# ==================== CAREER PATH APIs ====================

@hrm_advanced_router.get("/career-path/{employee_id}", response_model=CareerPathResponse)
async def get_career_path(
    employee_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy lộ trình phát triển nghề nghiệp"""
    employee = await db.users.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    profile = await db.employee_profiles.find_one({"user_id": employee_id}, {"_id": 0})
    
    # Calculate tenure
    join_date = profile.get("join_date") if profile else employee.get("created_at")
    tenure_months = 0
    if join_date:
        join = datetime.fromisoformat(join_date.replace('Z', '+00:00'))
        tenure_months = (datetime.now(timezone.utc) - join).days // 30
    
    current_position = profile.get("position_title", "N/A") if profile else "N/A"
    current_level = profile.get("position_level", "junior") if profile else "junior"
    
    # Get completed trainings
    completed_trainings = await db.employee_trainings.find({
        "employee_id": employee_id,
        "status": TrainingStatus.COMPLETED.value
    }, {"_id": 0, "course_title": 1}).to_list(100)
    
    # Build next positions based on current level
    next_positions = []
    
    # Example career path for Sales
    if "sales" in current_position.lower() or "kinh doanh" in current_position.lower():
        if current_level in ["junior", "fresher"]:
            next_positions = [
                {"position": "Senior Sales Executive", "requirements": ["2+ năm kinh nghiệm", "Đạt KPI 3 quý liên tiếp"], "timeline": "12-18 tháng"},
                {"position": "Team Leader", "requirements": ["3+ năm kinh nghiệm", "Hoàn thành khóa Leadership"], "timeline": "24-36 tháng"}
            ]
        elif current_level == "senior":
            next_positions = [
                {"position": "Team Leader", "requirements": ["Hoàn thành khóa Leadership", "Đạt KPI xuất sắc"], "timeline": "6-12 tháng"},
                {"position": "Sales Manager", "requirements": ["5+ năm kinh nghiệm", "Quản lý team tốt"], "timeline": "24-36 tháng"}
            ]
    
    return CareerPathResponse(
        employee_id=employee_id,
        employee_name=employee["full_name"],
        current_position=current_position,
        current_level=current_level,
        tenure_months=tenure_months,
        next_positions=next_positions,
        required_trainings=[
            {"course": "Kỹ năng Leadership", "status": "required"},
            {"course": "Quản lý đội nhóm", "status": "recommended"}
        ],
        required_experience=["Đạt KPI 3 quý liên tiếp", "Mentor 1 nhân viên mới"],
        completed_trainings=[t["course_title"] for t in completed_trainings],
        achievements=[],
        mentor_id=None,
        mentor_name=None
    )

# ==================== COMPANY CULTURE APIs ====================

@hrm_advanced_router.get("/company-culture", response_model=CompanyCultureResponse)
async def get_company_culture():
    """Lấy thông tin văn hóa doanh nghiệp"""
    culture = await db.company_culture.find_one({}, {"_id": 0})
    
    if not culture:
        # Return default
        return CompanyCultureResponse(
            id="default",
            company_name="ProHouzing Vietnam",
            
            mission="Mang đến giải pháp bất động sản toàn diện, minh bạch và đáng tin cậy cho khách hàng Việt Nam",
            vision="Trở thành công ty môi giới BĐS hàng đầu Việt Nam về ứng dụng công nghệ và chất lượng dịch vụ",
            
            core_values=[
                {"name": "Chính trực", "description": "Luôn trung thực, minh bạch trong mọi giao dịch"},
                {"name": "Chuyên nghiệp", "description": "Không ngừng nâng cao năng lực, phục vụ khách hàng tốt nhất"},
                {"name": "Sáng tạo", "description": "Đổi mới để mang lại giá trị vượt trội"},
                {"name": "Đồng đội", "description": "Hợp tác, hỗ trợ lẫn nhau để cùng thành công"},
                {"name": "Khách hàng là trung tâm", "description": "Mọi hoạt động đều hướng đến lợi ích khách hàng"}
            ],
            
            handbook_url=None,
            code_of_conduct=[
                "Đến làm việc đúng giờ",
                "Trang phục lịch sự, chuyên nghiệp",
                "Tôn trọng đồng nghiệp và khách hàng",
                "Bảo mật thông tin công ty",
                "Không sử dụng chất kích thích tại nơi làm việc"
            ],
            dress_code="Business casual. Nam: áo sơ mi, quần tây. Nữ: trang phục công sở lịch sự.",
            
            policies=[
                {"name": "Chính sách nghỉ phép", "content": "12 ngày phép năm, tăng 1 ngày/5 năm làm việc"},
                {"name": "Chính sách làm việc từ xa", "content": "Áp dụng cho một số vị trí, cần đăng ký trước"},
                {"name": "Chính sách đào tạo", "content": "Mỗi nhân viên được đào tạo tối thiểu 40 giờ/năm"}
            ],
            
            updated_at=datetime.now(timezone.utc).isoformat()
        )
    
    return CompanyCultureResponse(**culture)

@hrm_advanced_router.put("/company-culture")
async def update_company_culture(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật văn hóa doanh nghiệp"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    existing = await db.company_culture.find_one({})
    if existing:
        await db.company_culture.update_one({"_id": existing["_id"]}, {"$set": data})
    else:
        data["id"] = str(uuid.uuid4())
        await db.company_culture.insert_one(data)
    
    return {"success": True}
