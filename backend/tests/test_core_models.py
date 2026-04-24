"""
ProHouzing Core Models Test Suite
Version: 1.0.0

Tests for verifying the Master Data Model implementation.
"""

import pytest
import uuid
from datetime import datetime, date, timezone
from decimal import Decimal

# Test imports
def test_model_imports():
    """Test that all models can be imported"""
    from core.models import (
        Organization, OrganizationalUnit,
        User, UserMembership,
        Customer, CustomerIdentity, CustomerAddress,
        Project, ProjectStructure, Product, ProductPriceHistory,
        Lead, Deal, Booking, Deposit, Contract,
        Payment, PaymentScheduleItem,
        CommissionEntry, CommissionRule,
        Partner, PartnerContract,
        Assignment, Task, ActivityLog, DomainEvent
    )
    assert Organization is not None
    assert User is not None
    assert Customer is not None
    assert Deal is not None
    assert CommissionEntry is not None


def test_schema_imports():
    """Test that all schemas can be imported"""
    from core.schemas import (
        OrganizationCreate, OrganizationResponse,
        UserCreate, UserResponse,
        CustomerCreate, CustomerResponse,
        ProjectCreate, ProjectResponse,
        ProductCreate, ProductResponse,
        LeadCreate, LeadResponse,
        DealCreate, DealResponse,
        BookingCreate, BookingResponse,
        DepositCreate, DepositResponse,
        ContractCreate, ContractResponse,
        PaymentCreate, PaymentResponse,
        CommissionEntryCreate, CommissionEntryResponse,
    )
    assert OrganizationCreate is not None
    assert CustomerResponse is not None
    assert DealCreate is not None


def test_enum_imports():
    """Test that all enums can be imported"""
    from core.enums import (
        OrgType, OrgStatus, UnitType,
        UserType, UserStatus, RoleCode,
        CustomerType, CustomerStage, IdentityType,
        ProjectType, ProductType, InventoryStatus,
        LeadStatus, DealStage, BookingStatus,
        ContractStatus, PaymentStatus, CommissionType
    )
    assert OrgType.COMPANY.value == "company"
    assert DealStage.WON.value == "won"
    assert InventoryStatus.AVAILABLE.value == "available"


def test_database_connection():
    """Test database connection and table creation"""
    from core.database import Base, engine, IS_POSTGRES, IS_SQLITE
    
    # Check database type
    assert IS_POSTGRES or IS_SQLITE
    
    # Check tables exist
    assert len(Base.metadata.tables) == 26


def test_table_count():
    """Test that all 26 expected tables are defined"""
    from core.database import Base
    from core.models import (
        Organization, OrganizationalUnit,
        User, UserMembership,
        Customer, CustomerIdentity, CustomerAddress,
        Project, ProjectStructure, Product, ProductPriceHistory,
        Lead, Deal, Booking, Deposit, Contract,
        Payment, PaymentScheduleItem,
        CommissionEntry, CommissionRule,
        Partner, PartnerContract,
        Assignment, Task, ActivityLog, DomainEvent
    )
    
    expected_tables = {
        'organizations', 'organizational_units',
        'users', 'user_memberships',
        'customers', 'customer_identities', 'customer_addresses',
        'projects', 'project_structures', 'products', 'product_price_histories',
        'leads', 'deals', 'bookings', 'deposits', 'contracts',
        'payments', 'payment_schedule_items',
        'commission_entries', 'commission_rules',
        'partners', 'partner_contracts',
        'assignments', 'tasks', 'activity_logs', 'domain_events'
    }
    
    actual_tables = set(Base.metadata.tables.keys())
    assert actual_tables == expected_tables


def test_guid_type():
    """Test GUID type decorator"""
    from core.models.base import GUID, generate_uuid
    
    guid = GUID()
    new_uuid = generate_uuid()
    
    assert isinstance(new_uuid, uuid.UUID)


def test_utc_now():
    """Test UTC timestamp helper"""
    from core.models.base import utc_now
    
    now = utc_now()
    assert isinstance(now, datetime)
    assert now.tzinfo is not None


def test_normalize_phone():
    """Test phone normalization"""
    from core.models.base import normalize_phone
    
    assert normalize_phone("0901234567") == "+84901234567"
    assert normalize_phone("84901234567") == "+84901234567"
    assert normalize_phone("+84901234567") == "+84901234567"


def test_normalize_email():
    """Test email normalization"""
    from core.models.base import normalize_email
    
    assert normalize_email("Test@Example.COM") == "test@example.com"
    assert normalize_email("  user@test.com  ") == "user@test.com"


def test_generate_code():
    """Test code generation"""
    from core.models.base import generate_code
    
    assert generate_code("CUS", 123) == "CUS-000123"
    assert generate_code("ORD", 1) == "ORD-000001"


# Schema validation tests
def test_organization_create_schema():
    """Test OrganizationCreate schema validation"""
    from core.schemas import OrganizationCreate
    
    org = OrganizationCreate(
        code="ORG001",
        name="Test Organization",
        org_type="company"
    )
    assert org.code == "ORG001"
    assert org.name == "Test Organization"
    assert org.timezone == "Asia/Ho_Chi_Minh"


def test_customer_create_schema():
    """Test CustomerCreate schema validation"""
    from core.schemas import CustomerCreate
    
    org_id = uuid.uuid4()
    customer = CustomerCreate(
        org_id=org_id,
        full_name="Nguyễn Văn A",
        primary_phone="+84901234567",
        primary_email="test@example.com",
        customer_type="individual"
    )
    assert customer.full_name == "Nguyễn Văn A"
    assert customer.customer_type == "individual"
    assert customer.preferred_language == "vi"


def test_deal_create_schema():
    """Test DealCreate schema validation"""
    from core.schemas import DealCreate
    
    org_id = uuid.uuid4()
    customer_id = uuid.uuid4()
    deal = DealCreate(
        org_id=org_id,
        customer_id=customer_id,
        deal_name="Test Deal",
        deal_value=Decimal("1000000000"),
        current_stage="new"
    )
    assert deal.deal_name == "Test Deal"
    assert deal.deal_value == Decimal("1000000000")
    assert deal.sales_channel == "direct"


def test_api_response_schema():
    """Test API response schema"""
    from core.schemas import APIResponse, PaginationMeta
    
    meta = PaginationMeta(page=1, limit=20, total=100, total_pages=5)
    response = APIResponse(
        success=True,
        data={"test": "data"},
        meta=meta
    )
    assert response.success == True
    assert response.meta.total == 100


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
