"""
ProHouzing API v2 Tests
Version: 1.0.0

Unit tests for PostgreSQL Master Data Model API.
Tests service layer and API endpoints.
"""

import pytest
from uuid import uuid4, UUID
from datetime import datetime, date, timezone, timedelta
from decimal import Decimal
from typing import Generator, Dict, Any

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from fastapi.testclient import TestClient
from fastapi import FastAPI

# Import models and services
from core.database import Base, get_db
from core.models import (
    Organization, User, Customer, CustomerIdentity, CustomerAddress,
    Lead, Deal, Booking, Contract, Payment
)
from core.services import (
    BaseService, CustomerService, LeadService, DealService,
    BookingService, ContractService, PaymentService,
    customer_service, lead_service, deal_service,
    booking_service, contract_service, payment_service
)
from core.schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    LeadCreate, LeadUpdate, LeadResponse,
    DealCreate, DealUpdate, DealResponse, DealStageChangeRequest,
    BookingCreate, BookingResponse,
    ContractCreate, ContractResponse,
    PaymentCreate, PaymentResponse
)
from core.enums import (
    EntityStatus, CustomerStage, LeadStatus, LeadIntentLevel,
    DealStage, BookingStatus, ContractStatus, PaymentStatus, PaymentType
)


# ═══════════════════════════════════════════════════════════════════════════════
# TEST FIXTURES
# ═══════════════════════════════════════════════════════════════════════════════

# Use SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test_api_v2.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_org(db: Session) -> Organization:
    """Create a test organization."""
    org = Organization(
        org_name="Test Organization",
        org_code="TEST_ORG_001",
        status=EntityStatus.ACTIVE.value,
        created_by=uuid4()
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@pytest.fixture
def test_user(db: Session, test_org: Organization) -> User:
    """Create a test user."""
    user = User(
        org_id=test_org.id,
        email="test@prohouzing.vn",
        password_hash="hashed_password",
        full_name="Test User",
        employee_code="EMP001",
        status=EntityStatus.ACTIVE.value,
        created_by=test_org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_customer(db: Session, test_org: Organization, test_user: User) -> Customer:
    """Create a test customer."""
    customer = Customer(
        org_id=test_org.id,
        customer_code="CUST001",
        full_name="Nguyen Van A",
        primary_phone="0912345678",
        primary_email="nguyenvana@email.com",
        customer_type="individual",
        customer_stage=CustomerStage.LEAD.value,
        owner_user_id=test_user.id,
        status=EntityStatus.ACTIVE.value,
        created_by=test_user.id
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@pytest.fixture
def test_lead(db: Session, test_org: Organization, test_user: User) -> Lead:
    """Create a test lead."""
    lead = Lead(
        org_id=test_org.id,
        lead_code="LEAD001",
        contact_name="Tran Van B",
        contact_phone="0987654321",
        contact_email="tranvanb@email.com",
        source_channel="website",
        lead_status=LeadStatus.NEW.value,
        intent_level=LeadIntentLevel.MEDIUM.value,
        captured_at=datetime.now(timezone.utc),
        owner_user_id=test_user.id,
        status=EntityStatus.ACTIVE.value,
        created_by=test_user.id
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOMER SERVICE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCustomerService:
    """Test CustomerService CRUD operations."""
    
    def test_create_customer(self, db: Session, test_org: Organization, test_user: User):
        """Test creating a new customer."""
        customer_data = CustomerCreate(
            org_id=test_org.id,
            full_name="Le Thi C",
            primary_phone="0909090909",
            primary_email="lethic@email.com",
            customer_type="individual"
        )
        
        customer = customer_service.create(
            db, 
            obj_in=customer_data, 
            org_id=test_org.id, 
            created_by=test_user.id
        )
        
        assert customer is not None
        assert customer.full_name == "Le Thi C"
        assert customer.primary_phone == "0909090909"
        assert customer.org_id == test_org.id
        assert customer.customer_code is not None  # Auto-generated
    
    def test_get_customer(self, db: Session, test_org: Organization, test_customer: Customer):
        """Test getting a customer by ID."""
        customer = customer_service.get(db, id=test_customer.id, org_id=test_org.id)
        
        assert customer is not None
        assert customer.id == test_customer.id
        assert customer.full_name == test_customer.full_name
    
    def test_get_customer_wrong_org(self, db: Session, test_customer: Customer):
        """Test that customers are org-scoped."""
        wrong_org_id = uuid4()
        customer = customer_service.get(db, id=test_customer.id, org_id=wrong_org_id)
        
        assert customer is None
    
    def test_update_customer(self, db: Session, test_org: Organization, test_customer: Customer, test_user: User):
        """Test updating a customer."""
        update_data = CustomerUpdate(
            full_name="Nguyen Van A Updated",
            primary_email="updated@email.com"
        )
        
        updated = customer_service.update(
            db,
            id=test_customer.id,
            org_id=test_org.id,
            obj_in=update_data,
            updated_by=test_user.id
        )
        
        assert updated is not None
        assert updated.full_name == "Nguyen Van A Updated"
        assert updated.primary_email == "updated@email.com"
        assert updated.primary_phone == test_customer.primary_phone  # Unchanged
    
    def test_soft_delete_customer(self, db: Session, test_org: Organization, test_customer: Customer, test_user: User):
        """Test soft deleting a customer."""
        result = customer_service.delete(
            db,
            id=test_customer.id,
            org_id=test_org.id,
            deleted_by=test_user.id
        )
        
        assert result is True
        
        # Customer should not be found in normal queries
        customer = customer_service.get(db, id=test_customer.id, org_id=test_org.id)
        assert customer is None
    
    def test_list_customers_pagination(self, db: Session, test_org: Organization, test_user: User):
        """Test listing customers with pagination."""
        # Create multiple customers
        for i in range(25):
            customer = Customer(
                org_id=test_org.id,
                customer_code=f"CUST{i:03d}",
                full_name=f"Customer {i}",
                primary_phone=f"09{i:08d}",
                customer_type="individual",
                status=EntityStatus.ACTIVE.value,
                created_by=test_user.id
            )
            db.add(customer)
        db.commit()
        
        # Test pagination
        customers, total = customer_service.get_multi(
            db,
            org_id=test_org.id,
            skip=0,
            limit=10
        )
        
        assert len(customers) == 10
        assert total == 25
        
        # Second page
        customers, total = customer_service.get_multi(
            db,
            org_id=test_org.id,
            skip=10,
            limit=10
        )
        
        assert len(customers) == 10
        assert total == 25


# ═══════════════════════════════════════════════════════════════════════════════
# LEAD SERVICE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestLeadService:
    """Test LeadService operations."""
    
    def test_create_lead(self, db: Session, test_org: Organization, test_user: User):
        """Test creating a new lead."""
        lead_data = LeadCreate(
            org_id=test_org.id,
            contact_name="New Lead",
            contact_phone="0911111111",
            contact_email="newlead@email.com",
            source_channel="facebook"
        )
        
        lead = lead_service.create(
            db,
            obj_in=lead_data,
            org_id=test_org.id,
            created_by=test_user.id
        )
        
        assert lead is not None
        assert lead.contact_name == "New Lead"
        assert lead.source_channel == "facebook"
        assert lead.lead_status == LeadStatus.NEW.value
        assert lead.captured_at is not None
    
    def test_qualify_lead(self, db: Session, test_org: Organization, test_lead: Lead, test_user: User):
        """Test qualifying a lead."""
        qualified_lead = lead_service.qualify(
            db,
            id=test_lead.id,
            org_id=test_org.id,
            intent_level=LeadIntentLevel.HIGH.value,
            score=80,
            notes="Very interested customer",
            qualified_by=test_user.id
        )
        
        assert qualified_lead is not None
        assert qualified_lead.lead_status == LeadStatus.QUALIFIED.value
        assert qualified_lead.intent_level == LeadIntentLevel.HIGH.value
        assert qualified_lead.qualification_score == 80
    
    def test_mark_lead_contacted(self, db: Session, test_org: Organization, test_lead: Lead, test_user: User):
        """Test marking a lead as contacted."""
        initial_count = test_lead.contact_attempts or 0
        
        lead = lead_service.mark_contacted(
            db,
            id=test_lead.id,
            org_id=test_org.id,
            contacted_by=test_user.id
        )
        
        assert lead is not None
        assert lead.contact_attempts == initial_count + 1
        assert lead.lead_status == LeadStatus.CONTACTED.value


# ═══════════════════════════════════════════════════════════════════════════════
# DEAL SERVICE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestDealService:
    """Test DealService operations."""
    
    def test_create_deal(self, db: Session, test_org: Organization, test_user: User, test_customer: Customer):
        """Test creating a new deal."""
        deal_data = DealCreate(
            org_id=test_org.id,
            customer_id=test_customer.id,
            deal_name="Test Deal",
            estimated_value=Decimal("5000000000"),
            currency_code="VND"
        )
        
        deal = deal_service.create(
            db,
            obj_in=deal_data,
            org_id=test_org.id,
            created_by=test_user.id
        )
        
        assert deal is not None
        assert deal.deal_name == "Test Deal"
        assert deal.customer_id == test_customer.id
        assert deal.current_stage == DealStage.LEAD.value
        assert deal.deal_code is not None
    
    def test_change_deal_stage(self, db: Session, test_org: Organization, test_user: User, test_customer: Customer):
        """Test changing deal stage."""
        # First create a deal
        deal_data = DealCreate(
            org_id=test_org.id,
            customer_id=test_customer.id,
            deal_name="Stage Test Deal",
            estimated_value=Decimal("3000000000"),
            currency_code="VND"
        )
        deal = deal_service.create(db, obj_in=deal_data, org_id=test_org.id, created_by=test_user.id)
        
        # Change stage
        request = DealStageChangeRequest(
            new_stage=DealStage.QUALIFICATION.value,
            notes="Customer qualified"
        )
        
        updated_deal = deal_service.change_stage(
            db,
            id=deal.id,
            org_id=test_org.id,
            request=request,
            changed_by=test_user.id
        )
        
        assert updated_deal is not None
        assert updated_deal.current_stage == DealStage.QUALIFICATION.value
        assert updated_deal.stage_changed_at is not None


# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-TENANCY TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestMultiTenancy:
    """Test multi-tenancy isolation."""
    
    def test_customer_org_isolation(self, db: Session, test_user: User):
        """Test that customers are isolated by organization."""
        # Create two organizations
        org1 = Organization(
            org_name="Org 1",
            org_code="ORG001",
            status=EntityStatus.ACTIVE.value,
            created_by=uuid4()
        )
        org2 = Organization(
            org_name="Org 2",
            org_code="ORG002",
            status=EntityStatus.ACTIVE.value,
            created_by=uuid4()
        )
        db.add_all([org1, org2])
        db.commit()
        
        # Create customers in each org
        customer1 = Customer(
            org_id=org1.id,
            customer_code="CUST_ORG1",
            full_name="Org1 Customer",
            primary_phone="0901111111",
            customer_type="individual",
            status=EntityStatus.ACTIVE.value,
            created_by=uuid4()
        )
        customer2 = Customer(
            org_id=org2.id,
            customer_code="CUST_ORG2",
            full_name="Org2 Customer",
            primary_phone="0902222222",
            customer_type="individual",
            status=EntityStatus.ACTIVE.value,
            created_by=uuid4()
        )
        db.add_all([customer1, customer2])
        db.commit()
        
        # Verify isolation
        org1_customers, _ = customer_service.get_multi(db, org_id=org1.id)
        org2_customers, _ = customer_service.get_multi(db, org_id=org2.id)
        
        assert len(org1_customers) == 1
        assert len(org2_customers) == 1
        assert org1_customers[0].full_name == "Org1 Customer"
        assert org2_customers[0].full_name == "Org2 Customer"


# ═══════════════════════════════════════════════════════════════════════════════
# SOFT DELETE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestSoftDelete:
    """Test soft delete functionality."""
    
    def test_soft_deleted_not_in_list(self, db: Session, test_org: Organization, test_user: User):
        """Test that soft-deleted records are excluded from list queries."""
        # Create 3 customers
        for i in range(3):
            customer = Customer(
                org_id=test_org.id,
                customer_code=f"SOFT_DEL_{i}",
                full_name=f"Customer {i}",
                primary_phone=f"090{i}000000",
                customer_type="individual",
                status=EntityStatus.ACTIVE.value,
                created_by=test_user.id
            )
            db.add(customer)
        db.commit()
        
        # Soft delete one
        customers, total = customer_service.get_multi(db, org_id=test_org.id)
        customer_to_delete = customers[0]
        
        customer_service.delete(
            db,
            id=customer_to_delete.id,
            org_id=test_org.id,
            deleted_by=test_user.id
        )
        
        # Verify count
        customers_after, total_after = customer_service.get_multi(db, org_id=test_org.id)
        assert total_after == total - 1
    
    def test_restore_soft_deleted(self, db: Session, test_org: Organization, test_customer: Customer, test_user: User):
        """Test restoring a soft-deleted record."""
        # Soft delete
        customer_service.delete(db, id=test_customer.id, org_id=test_org.id, deleted_by=test_user.id)
        
        # Verify deleted
        customer = customer_service.get(db, id=test_customer.id, org_id=test_org.id)
        assert customer is None
        
        # Restore
        restored = customer_service.restore(
            db,
            id=test_customer.id,
            org_id=test_org.id,
            restored_by=test_user.id
        )
        
        assert restored is not None
        assert restored.deleted_at is None


# ═══════════════════════════════════════════════════════════════════════════════
# RUN TESTS
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
