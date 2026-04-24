"""
ProHouzing Governance Foundation Config

Static phase-1 governance source of truth for:
- canonical domains
- status models
- approval flows
- timeline streams
- entity governance mapping
"""

CANONICAL_DOMAINS = [
    {
        "domain": "Organization",
        "purpose": "Quan tri da phong ban, da team, da chi nhanh",
        "entities": ["organization", "branch", "department", "team", "position", "user", "user_membership"],
        "workflows": ["access control", "ownership", "resource visibility"],
        "governance": ["RBAC", "audit_log", "approval_scope"],
    },
    {
        "domain": "Customer",
        "purpose": "Customer 360 va lead lifecycle",
        "entities": ["customer", "customer_identity", "lead", "demand_profile", "interaction", "tag"],
        "workflows": ["lead capture", "deduplication", "assignment", "customer timeline"],
        "governance": ["status_model", "audit_log", "timeline_events"],
    },
    {
        "domain": "Product",
        "purpose": "Gio hang so cap va inventory chuan",
        "entities": ["developer", "project", "project_structure", "product", "price_history", "promotion"],
        "workflows": ["inventory update", "pricing", "public publishing"],
        "governance": ["status_model", "approval_matrix", "audit_log"],
    },
    {
        "domain": "Sales",
        "purpose": "Lead -> deal -> booking -> chot giao dich",
        "entities": ["deal", "booking", "booking_queue", "sales_event", "allocation_result"],
        "workflows": ["deal pipeline", "soft booking", "hard booking", "allocation"],
        "governance": ["status_model", "approval_matrix", "timeline_events"],
    },
    {
        "domain": "Contract & Legal",
        "purpose": "Hop dong va ho so phap ly xuyen suot",
        "entities": ["contract", "contract_version", "contract_approval", "legal_document", "compliance_item"],
        "workflows": ["contract approval", "legal checklist", "amendment tracking"],
        "governance": ["approval_matrix", "audit_log", "timeline_events"],
    },
    {
        "domain": "Finance",
        "purpose": "Thuc thu, cong no, payout, du bao",
        "entities": ["payment", "payment_schedule_item", "receivable", "expense", "budget", "ledger_event"],
        "workflows": ["receivable tracking", "expense control", "cash reporting"],
        "governance": ["approval_matrix", "audit_log", "alert_hooks"],
    },
    {
        "domain": "Commission",
        "purpose": "Tinh hoa hong va doi soat payout",
        "entities": ["commission_rule", "commission_entry", "commission_split", "payout_batch", "payout_item"],
        "workflows": ["commission calculation", "payout approval", "income tracking"],
        "governance": ["approval_matrix", "audit_log", "timeline_events"],
    },
    {
        "domain": "HR",
        "purpose": "Nhan su chinh thuc, CTV, onboarding, payroll",
        "entities": ["employee_profile", "collaborator_profile", "recruitment_candidate", "payroll_record", "attendance_record"],
        "workflows": ["recruitment", "onboarding", "payroll"],
        "governance": ["status_model", "approval_matrix", "audit_log"],
    },
]

STATUS_MODELS = [
    {
        "title": "Lead Status",
        "code": "lead_status",
        "states": ["new", "contacted", "qualified", "viewing", "hot", "converted", "lost"],
        "rule": "Lead chi duoc convert sang deal khi da qualified hoac hot.",
    },
    {
        "title": "Deal Stage",
        "code": "deal_stage",
        "states": ["new", "consulting", "proposal", "negotiation", "soft_booking", "hard_booking", "won", "lost"],
        "rule": "Deal khong duoc ve hard_booking neu chua gan product.",
    },
    {
        "title": "Booking Status",
        "code": "booking_status",
        "states": ["draft", "queued", "reserved", "confirmed", "expired", "cancelled"],
        "rule": "Booking queued va reserved phai co expiry time de tranh giu cho vo han.",
    },
    {
        "title": "Contract Status",
        "code": "contract_status",
        "states": ["draft", "pending_sales", "pending_legal", "approved", "signed", "amended", "cancelled"],
        "rule": "Hop dong chi duoc signed sau khi approval day du.",
    },
    {
        "title": "Payment Status",
        "code": "payment_status",
        "states": ["pending", "scheduled", "partially_paid", "paid", "overdue", "cancelled"],
        "rule": "Payment overdue phai kich hoat alert cho finance va sales owner.",
    },
    {
        "title": "Payout Status",
        "code": "payout_status",
        "states": ["draft", "pending_manager", "pending_finance", "approved", "paid", "rejected"],
        "rule": "Payout khong duoc approved neu khong truy duoc commission source.",
    },
]

STATUS_RULES = [
    "Khong cho phep status free-text cho cac entity core.",
    "Moi transition quan trong phai co actor, timestamp va ly do neu la override.",
    "Status thay doi phai duoc day vao timeline va audit log.",
    "Dashboard dieu hanh chi doc chi so tu state machine canonical.",
]

APPROVAL_FLOWS = [
    {
        "title": "Booking Exception Approval",
        "owner": "Sales Manager",
        "steps": ["Sales Owner request", "Manager review", "Ops confirmation"],
        "trigger": "Booking ngoai policy, override queue, reserve qua quota.",
    },
    {
        "title": "Contract Approval",
        "owner": "Legal",
        "steps": ["Sales review", "Legal review", "Final approval"],
        "trigger": "Hop dong moi, phu luc, dieu chinh dieu khoan.",
    },
    {
        "title": "Payout Approval",
        "owner": "Finance",
        "steps": ["Manager confirm source", "Finance verify", "Final payout approval"],
        "trigger": "Chi hoa hong, chi payout batch, chi thuong dac biet.",
    },
    {
        "title": "Expense Approval",
        "owner": "Finance Controller",
        "steps": ["Requester submit", "Budget owner review", "Finance approve"],
        "trigger": "Chi phi marketing, van hanh, sales support, su kien.",
    },
]

APPROVAL_RULES = [
    "Moi approval phai co resource_type, resource_id, current_step va final_status.",
    "Khong duyet mieng cho cac dong tien va ngoai le anh huong doanh thu.",
    "Moi reject phai co ly do va duoc ghi vao timeline.",
    "Approval step phai map duoc sang role, khong hardcode theo ten nguoi dung.",
]

AUDIT_RULES = [
    "Moi thao tac quan trong phai co actor_id, resource_type, resource_id, action, created_at.",
    "Thay doi nhay cam phai luu before_value va after_value de doi soat.",
    "Khong cap nhat du lieu core ma khong sinh audit event.",
    "Audit event va timeline event la hai lop lien ket, nhung khong duoc tron nghia voi nhau.",
]

TIMELINE_STREAMS = [
    {
        "title": "Lead Timeline",
        "items": ["lead_created", "lead_assigned", "interaction_logged", "lead_status_changed"],
    },
    {
        "title": "Deal Timeline",
        "items": ["deal_created", "deal_stage_changed", "product_matched", "deal_lost_or_won"],
    },
    {
        "title": "Booking Timeline",
        "items": ["booking_created", "queue_joined", "reserved", "confirmed", "expired"],
    },
    {
        "title": "Finance Timeline",
        "items": ["payment_scheduled", "payment_recorded", "commission_calculated", "payout_approved"],
    },
]

AUDIT_DELIVERABLES = [
    "Audit event schema",
    "Timeline event schema",
    "Actor and resource mapping",
    "Before/after diff policy",
    "UI history panels cho cac module core",
    "Alert hooks cho override va exception",
]

CRITICAL_MOMENTS = [
    "Lead ownership thay doi",
    "Deal chuyen stage",
    "Booking override queue",
    "Contract approve / reject",
    "Payment overdue",
    "Payout approve / reject",
]

FOUNDATION_RULES = [
    "PostgreSQL la single source of truth cho transactional data moi.",
    "Khong mo rong them model core tren legacy Mongo.",
    "Moi entity quan trong phai co id, created_at, updated_at, created_by, updated_by.",
    "Moi workflow quan trong phai co owner, status model, audit log va timeline.",
]

MIGRATION_PRIORITIES = [
    "organization / users / roles",
    "projects / products / price histories",
    "customers / leads / demands",
    "deals / bookings / contracts",
    "payments / commission / payouts",
    "hr / payroll / training",
]

FOUNDATION_DELIVERABLES = [
    "Canonical entity list",
    "Relationship map",
    "State machine list",
    "Approval model",
    "Audit model",
    "Master data list",
    "Migration mapping",
    "Import templates",
]

CHANGE_MANAGEMENT_QUEUE = [
    {
        "id": "chg-001",
        "title": "Chuẩn hóa trạng thái lead về canonical model",
        "module": "CRM / Lead",
        "change_type": "status_normalization",
        "priority": "critical",
        "status": "can_thuc_hien",
        "owner": "Sales Ops",
        "impact": "Ảnh hưởng funnel, phân bổ lead và báo cáo chuyển đổi.",
        "next_action": "Đối chiếu lead_statuses với lead_status rồi áp dụng mapping chuẩn.",
    },
    {
        "id": "chg-002",
        "title": "Khóa quy trình duyệt booking ngoại lệ",
        "module": "Booking",
        "change_type": "approval_control",
        "priority": "critical",
        "status": "cho_phe_duyet",
        "owner": "Kinh doanh + Vận hành",
        "impact": "Ảnh hưởng giữ chỗ, suất booking và kỷ luật bán hàng.",
        "next_action": "Ban hành luồng duyệt 3 bước cho override queue và giữ chỗ quá hạn mức.",
    },
    {
        "id": "chg-003",
        "title": "Đồng bộ trạng thái hợp đồng với pháp lý và kế toán",
        "module": "Hợp đồng",
        "change_type": "workflow_alignment",
        "priority": "high",
        "status": "dang_ra_soat",
        "owner": "Pháp lý",
        "impact": "Ảnh hưởng tiến độ ký, phụ lục, thanh toán và truy vết hồ sơ.",
        "next_action": "Chuẩn hóa contract_status và timeline ký kết theo một nguồn trạng thái duy nhất.",
    },
    {
        "id": "chg-004",
        "title": "Bổ sung master data cho nguồn hàng sơ cấp",
        "module": "Sản phẩm",
        "change_type": "master_data_extension",
        "priority": "high",
        "status": "ban_nhap",
        "owner": "Sản phẩm",
        "impact": "Ảnh hưởng giỏ hàng, báo giá và phân phối sản phẩm theo chủ đầu tư.",
        "next_action": "Thêm category phục vụ inventory, block, giỏ hàng và chính sách bán.",
    },
]

STATUS_NORMALIZATION_HINTS = {
    "lead_statuses": {
        "contact_attempted": "contacted",
        "nurturing": "qualified",
        "site_visit": "viewing",
        "closed_won": "converted",
        "closed_lost": "lost",
    },
    "deal_stages": {
        "qualification": "consulting",
        "quotation": "proposal",
        "booking_request": "soft_booking",
        "booked": "hard_booking",
        "closed_won": "won",
        "closed_lost": "lost",
    },
    "booking_statuses": {
        "pending": "queued",
        "holding": "reserved",
        "booked": "confirmed",
        "released": "expired",
    },
    "contract_statuses": {
        "pending_manager": "pending_sales",
        "pending_director": "pending_legal",
        "completed": "signed",
        "terminated": "cancelled",
    },
}


def _status_links_for_entity(domain_name: str, entity: str):
    if entity == "lead":
        return ["lead_status"]
    if entity == "deal":
        return ["deal_stage"]
    if entity in {"booking", "booking_queue"}:
        return ["booking_status"]
    if entity in {"contract", "contract_version"}:
        return ["contract_status"]
    if entity in {"payment", "payment_schedule_item", "receivable"}:
        return ["payment_status"]
    if entity in {"payout_batch", "payout_item"}:
        return ["payout_status"]
    if domain_name == "HR":
        return ["contract_status"]
    return []


def _approval_links_for_domain(domain_name: str):
    if domain_name == "Sales":
        return ["Booking Exception Approval"]
    if domain_name == "Contract & Legal":
        return ["Contract Approval"]
    if domain_name in {"Finance", "Commission"}:
        return ["Payout Approval", "Expense Approval"]
    if domain_name == "HR":
        return ["Expense Approval"]
    return []


def _timeline_links_for_entity(domain_name: str, entity: str):
    if entity in {"lead", "customer", "customer_identity"}:
        return ["Lead Timeline"]
    if entity == "deal":
        return ["Deal Timeline"]
    if entity in {"booking", "booking_queue"}:
        return ["Booking Timeline"]
    if domain_name in {"Finance", "Commission"}:
        return ["Finance Timeline"]
    if domain_name == "Contract & Legal":
        return ["Deal Timeline"]
    return []


def get_entity_governance_index():
    index = []
    for domain in CANONICAL_DOMAINS:
        for entity in domain["entities"]:
            controls = domain.get("governance", [])
            index.append({
                "entity": entity,
                "domain": domain["domain"],
                "purpose": domain["purpose"],
                "workflows": domain.get("workflows", []),
                "controls": controls,
                "linked_status_models": _status_links_for_entity(domain["domain"], entity) if "status_model" in controls else [],
                "linked_approval_flows": _approval_links_for_domain(domain["domain"]) if "approval_matrix" in controls else [],
                "linked_timeline_streams": _timeline_links_for_entity(domain["domain"], entity) if "timeline_events" in controls else [],
            })
    return index


def get_entity_governance(entity_name: str):
    return next((item for item in get_entity_governance_index() if item["entity"] == entity_name), None)


def get_governance_summary():
    entity_index = get_entity_governance_index()
    return {
        "domain_count": len(CANONICAL_DOMAINS),
        "mapped_entity_count": len(entity_index),
        "status_model_count": len(STATUS_MODELS),
        "approval_flow_count": len(APPROVAL_FLOWS),
        "timeline_stream_count": len(TIMELINE_STREAMS),
        "critical_moment_count": len(CRITICAL_MOMENTS),
    }


def get_status_model_for_master_data_key(category_key: str):
    mapping = {
        "lead_statuses": "lead_status",
        "deal_stages": "deal_stage",
        "booking_statuses": "booking_status",
        "contract_statuses": "contract_status",
        "payment_statuses": "payment_status",
        "payout_statuses": "payout_status",
    }
    return mapping.get(category_key)


def get_status_normalization_hints(category_key: str):
    return STATUS_NORMALIZATION_HINTS.get(category_key, {})
