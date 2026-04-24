"""
ProHouzing Customer Service
Version: 1.0.0

Customer management with:
- Deduplication via CustomerIdentity
- Ownership assignment
- Merge support
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import Session

from .base import BaseService
from ..models.customer import Customer, CustomerIdentity, CustomerAddress
from ..models.base import normalize_phone, normalize_email, generate_code, utc_now
from ..schemas.customer import (
    CustomerCreate, CustomerUpdate, 
    CustomerIdentityCreate, CustomerAddressCreate
)


class CustomerService(BaseService[Customer, CustomerCreate, CustomerUpdate]):
    """
    Customer service with deduplication and identity management.
    """
    
    def __init__(self):
        super().__init__(Customer)
        self._code_counter = {}  # Per-org counter for code generation
    
    def create(
        self,
        db: Session,
        *,
        obj_in: CustomerCreate,
        org_id: UUID,
        created_by: Optional[UUID] = None
    ) -> Customer:
        """
        Create a customer with auto-generated code.
        Also creates primary identity records.
        """
        # Generate customer_code if not provided
        obj_data = obj_in.model_dump(exclude_unset=True)
        
        if not obj_data.get('customer_code'):
            obj_data['customer_code'] = self._generate_code(db, org_id)
        
        # Normalize phone and email
        if obj_data.get('primary_phone'):
            obj_data['primary_phone'] = normalize_phone(obj_data['primary_phone'])
        if obj_data.get('primary_email'):
            obj_data['primary_email'] = normalize_email(obj_data['primary_email'])
        
        obj_data['org_id'] = org_id
        if created_by:
            obj_data['created_by'] = created_by
            obj_data['updated_by'] = created_by
        
        # Create customer
        customer = Customer(**obj_data)
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        # Create identity records for phone and email
        if customer.primary_phone:
            self._create_identity(
                db, customer.id, org_id, "phone", 
                customer.primary_phone, is_primary=True, created_by=created_by
            )
        
        if customer.primary_email:
            self._create_identity(
                db, customer.id, org_id, "email",
                customer.primary_email, is_primary=True, created_by=created_by
            )
        
        return customer
    
    def _generate_code(self, db: Session, org_id: UUID) -> str:
        """Generate unique customer code within org."""
        # Get max existing code number
        query = select(func.count()).select_from(Customer).where(
            Customer.org_id == org_id
        )
        count = db.execute(query).scalar() or 0
        return generate_code("CUS", count + 1)
    
    def _create_identity(
        self,
        db: Session,
        customer_id: UUID,
        org_id: UUID,
        identity_type: str,
        value: str,
        is_primary: bool = False,
        created_by: Optional[UUID] = None
    ) -> Optional[CustomerIdentity]:
        """Create a customer identity record."""
        normalized = CustomerIdentity.normalize_value(identity_type, value)
        
        # Check for existing identity (dedup)
        existing = self.find_by_identity(db, org_id=org_id, identity_type=identity_type, value=normalized)
        if existing:
            return None  # Identity already exists
        
        identity = CustomerIdentity(
            customer_id=customer_id,
            org_id=org_id,
            identity_type=identity_type,
            identity_value_raw=value,
            identity_value_normalized=normalized,
            is_primary=is_primary,
            created_by=created_by,
            updated_by=created_by
        )
        db.add(identity)
        db.commit()
        db.refresh(identity)
        return identity
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DEDUPLICATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def find_by_identity(
        self,
        db: Session,
        *,
        org_id: UUID,
        identity_type: str,
        value: str
    ) -> Optional[Customer]:
        """
        Find customer by identity (phone/email/zalo).
        Used for deduplication.
        """
        normalized = CustomerIdentity.normalize_value(identity_type, value)
        
        query = select(Customer).join(CustomerIdentity).where(
            and_(
                CustomerIdentity.org_id == org_id,
                CustomerIdentity.identity_type == identity_type,
                CustomerIdentity.identity_value_normalized == normalized,
                CustomerIdentity.deleted_at.is_(None),
                Customer.deleted_at.is_(None)
            )
        )
        
        result = db.execute(query)
        return result.scalar_one_or_none()
    
    def find_by_phone(
        self,
        db: Session,
        *,
        org_id: UUID,
        phone: str
    ) -> Optional[Customer]:
        """Find customer by phone number."""
        return self.find_by_identity(db, org_id=org_id, identity_type="phone", value=phone)
    
    def find_by_email(
        self,
        db: Session,
        *,
        org_id: UUID,
        email: str
    ) -> Optional[Customer]:
        """Find customer by email."""
        return self.find_by_identity(db, org_id=org_id, identity_type="email", value=email)
    
    def find_duplicates(
        self,
        db: Session,
        *,
        org_id: UUID,
        phone: Optional[str] = None,
        email: Optional[str] = None
    ) -> List[Customer]:
        """Find potential duplicate customers."""
        duplicates = []
        
        if phone:
            customer = self.find_by_phone(db, org_id=org_id, phone=phone)
            if customer:
                duplicates.append(customer)
        
        if email:
            customer = self.find_by_email(db, org_id=org_id, email=email)
            if customer and customer not in duplicates:
                duplicates.append(customer)
        
        return duplicates
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SEARCH
    # ═══════════════════════════════════════════════════════════════════════════
    
    def search(
        self,
        db: Session,
        *,
        org_id: UUID,
        query: str,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Customer], int]:
        """
        Search customers by name, phone, email.
        """
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            search=query,
            search_fields=["full_name", "primary_phone", "primary_email", "customer_code"]
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # OWNERSHIP
    # ═══════════════════════════════════════════════════════════════════════════
    
    def assign_owner(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        owner_user_id: Optional[UUID] = None,
        owner_unit_id: Optional[UUID] = None,
        assigned_by: Optional[UUID] = None
    ) -> Optional[Customer]:
        """Assign customer to a user/unit."""
        customer = self.get(db, id=id, org_id=org_id)
        if not customer:
            return None
        
        customer.owner_user_id = owner_user_id
        customer.owner_unit_id = owner_unit_id
        customer.assigned_at = utc_now().date()
        
        if assigned_by:
            customer.updated_by = assigned_by
        
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer
    
    def get_by_owner(
        self,
        db: Session,
        *,
        org_id: UUID,
        owner_user_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Customer], int]:
        """Get customers owned by a user."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"owner_user_id": owner_user_id}
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STAGE MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    def update_stage(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        new_stage: str,
        updated_by: Optional[UUID] = None
    ) -> Optional[Customer]:
        """Update customer lifecycle stage."""
        return self.update_field(
            db,
            id=id,
            org_id=org_id,
            field="customer_stage",
            value=new_stage,
            updated_by=updated_by
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # IDENTITY MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    def add_identity(
        self,
        db: Session,
        *,
        customer_id: UUID,
        org_id: UUID,
        identity_type: str,
        value: str,
        created_by: Optional[UUID] = None
    ) -> Optional[CustomerIdentity]:
        """Add a new identity to a customer."""
        # Verify customer exists
        customer = self.get(db, id=customer_id, org_id=org_id)
        if not customer:
            return None
        
        return self._create_identity(
            db, customer_id, org_id, identity_type, value, created_by=created_by
        )
    
    def get_identities(
        self,
        db: Session,
        *,
        customer_id: UUID,
        org_id: UUID
    ) -> List[CustomerIdentity]:
        """Get all identities for a customer."""
        query = select(CustomerIdentity).where(
            and_(
                CustomerIdentity.customer_id == customer_id,
                CustomerIdentity.org_id == org_id,
                CustomerIdentity.deleted_at.is_(None)
            )
        )
        result = db.execute(query)
        return list(result.scalars().all())
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ADDRESS MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    def add_address(
        self,
        db: Session,
        *,
        obj_in: CustomerAddressCreate,
        created_by: Optional[UUID] = None
    ) -> CustomerAddress:
        """Add an address to a customer."""
        obj_data = obj_in.model_dump(exclude_unset=True)
        if created_by:
            obj_data['created_by'] = created_by
            obj_data['updated_by'] = created_by
        
        address = CustomerAddress(**obj_data)
        db.add(address)
        db.commit()
        db.refresh(address)
        return address
    
    def get_addresses(
        self,
        db: Session,
        *,
        customer_id: UUID,
        org_id: UUID
    ) -> List[CustomerAddress]:
        """Get all addresses for a customer."""
        query = select(CustomerAddress).where(
            and_(
                CustomerAddress.customer_id == customer_id,
                CustomerAddress.org_id == org_id,
                CustomerAddress.deleted_at.is_(None)
            )
        )
        result = db.execute(query)
        return list(result.scalars().all())
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STATISTICS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def increment_stats(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        deals: int = 0,
        revenue: int = 0
    ) -> Optional[Customer]:
        """Increment customer statistics (called after deal closes)."""
        customer = self.get(db, id=id, org_id=org_id)
        if not customer:
            return None
        
        customer.total_deals = (customer.total_deals or 0) + deals
        customer.total_revenue = (customer.total_revenue or 0) + revenue
        customer.last_interaction_at = utc_now().date()
        
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer


# Singleton instance
customer_service = CustomerService()
