"""
ProHouzing Lead Service
Version: 2.0.0 (Prompt 2/18)

Lead management with:
- Lead capture from multiple sources
- Lead qualification
- Lead conversion to Deal
- Event emission (Prompt 2/18)
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from .base import BaseService
from ..models.lead import Lead
from ..models.customer import Customer
from ..models.base import normalize_phone, normalize_email, generate_code, utc_now
from ..schemas.lead import LeadCreate, LeadUpdate, LeadConvertRequest


class LeadService(BaseService[Lead, LeadCreate, LeadUpdate]):
    """
    Lead service with qualification and conversion.
    """
    
    def __init__(self):
        super().__init__(Lead)
    
    def create(
        self,
        db: Session,
        *,
        obj_in: LeadCreate,
        org_id: UUID,
        created_by: Optional[UUID] = None
    ) -> Lead:
        """
        Create a lead with auto-generated code.
        """
        obj_data = obj_in.model_dump(exclude_unset=True)
        
        # Generate lead_code if not provided
        if not obj_data.get('lead_code'):
            obj_data['lead_code'] = self._generate_code(db, org_id)
        
        # Normalize contact info
        if obj_data.get('contact_phone'):
            obj_data['contact_phone'] = normalize_phone(obj_data['contact_phone'])
        if obj_data.get('contact_email'):
            obj_data['contact_email'] = normalize_email(obj_data['contact_email'])
        
        obj_data['org_id'] = org_id
        obj_data['captured_at'] = utc_now()
        
        if created_by:
            obj_data['created_by'] = created_by
            obj_data['updated_by'] = created_by
        
        lead = Lead(**obj_data)
        db.add(lead)
        db.commit()
        db.refresh(lead)
        
        # Emit lead.created event
        self._emit_lead_created(db, lead, created_by)
        
        return lead
    
    def _emit_lead_created(
        self,
        db: Session,
        lead: Lead,
        actor_user_id: Optional[UUID]
    ) -> None:
        """Emit lead.created event."""
        from .event_service import event_service
        from .event_catalog import EventCode
        
        event_service.emit_event(
            db,
            event_code=EventCode.LEAD_CREATED,
            org_id=lead.org_id,
            aggregate_type="lead",
            aggregate_id=lead.id,
            payload={
                "lead_code": lead.lead_code,
                "contact_name": lead.contact_name,
                "contact_phone": lead.contact_phone,
                "contact_email": lead.contact_email,
                "source_channel": lead.source_channel,
                "source_campaign": lead.source_campaign,
                "entity_name": lead.lead_code,
                "source": lead.source_channel or "unknown",
            },
            actor_user_id=actor_user_id,
            actor_type="user",
            entity_code=lead.lead_code,
            entity_name=lead.contact_name or lead.lead_code,
            related_customer_id=lead.customer_id,
        )
        db.commit()
    
    def _generate_code(self, db: Session, org_id: UUID) -> str:
        """Generate unique lead code."""
        query = select(func.count()).select_from(Lead).where(Lead.org_id == org_id)
        count = db.execute(query).scalar() or 0
        return generate_code("LEAD", count + 1)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # QUALIFICATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def qualify(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        intent_level: str,
        score: Optional[int] = None,
        notes: Optional[str] = None,
        qualified_by: Optional[UUID] = None
    ) -> Optional[Lead]:
        """
        Qualify a lead.
        """
        lead = self.get(db, id=id, org_id=org_id)
        if not lead:
            return None
        
        lead.lead_status = "qualified"
        lead.intent_level = intent_level
        lead.qualification_score = score
        lead.qualification_notes = notes
        lead.qualified_at = utc_now()
        
        if qualified_by:
            lead.updated_by = qualified_by
        
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    
    def mark_contacted(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        contacted_by: Optional[UUID] = None
    ) -> Optional[Lead]:
        """Mark lead as contacted."""
        lead = self.get(db, id=id, org_id=org_id)
        if not lead:
            return None
        
        if lead.lead_status == "new":
            lead.lead_status = "contacted"
        
        lead.contact_attempts = (lead.contact_attempts or 0) + 1
        lead.last_contact_at = utc_now()
        
        if not lead.first_contacted_at:
            lead.first_contacted_at = utc_now()
        
        if contacted_by:
            lead.updated_by = contacted_by
        
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    
    def mark_lost(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        reason: str,
        detail: Optional[str] = None,
        lost_by: Optional[UUID] = None
    ) -> Optional[Lead]:
        """Mark lead as lost."""
        lead = self.get(db, id=id, org_id=org_id)
        if not lead:
            return None
        
        lead.lead_status = "lost"
        lead.lost_reason = reason
        lead.lost_reason_detail = detail
        lead.closed_at = utc_now()
        
        if lost_by:
            lead.updated_by = lost_by
        
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CONVERSION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def convert_to_deal(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        request: LeadConvertRequest,
        converted_by: Optional[UUID] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Convert lead to deal.
        Optionally creates a new customer.
        
        Returns dict with customer_id and deal_id.
        """
        from .customer import customer_service
        from .deal import deal_service
        
        lead = self.get(db, id=id, org_id=org_id)
        if not lead:
            return None
        
        if not lead.is_convertible:
            return None
        
        customer_id = request.customer_id
        
        # Create customer if requested
        if request.create_customer and not customer_id:
            from ..schemas.customer import CustomerCreate
            
            customer_data = CustomerCreate(
                org_id=org_id,
                full_name=lead.contact_name,
                primary_phone=lead.contact_phone,
                primary_email=lead.contact_email,
                lead_source_primary=lead.source_channel,
                customer_stage="prospect"
            )
            
            customer = customer_service.create(
                db, obj_in=customer_data, org_id=org_id, created_by=converted_by
            )
            customer_id = customer.id
            
            # Link lead to customer
            lead.customer_id = customer_id
        
        if not customer_id:
            return None
        
        # Create deal
        from ..schemas.deal import DealCreate
        
        deal_data = DealCreate(
            org_id=org_id,
            customer_id=customer_id,
            deal_name=f"Deal - {lead.contact_name}",
            source_ref_type="lead",
            source_lead_id=lead.id,
            product_id=request.product_id,
            project_id=request.project_id,
            deal_value=request.deal_value,
            owner_user_id=request.owner_user_id or lead.owner_user_id,
            notes=request.notes
        )
        
        deal = deal_service.create(
            db, obj_in=deal_data, org_id=org_id, created_by=converted_by
        )
        
        # Update lead
        lead.lead_status = "converted"
        lead.converted_at = utc_now()
        lead.converted_to_deal_id = deal.id
        lead.closed_at = utc_now()
        
        if converted_by:
            lead.updated_by = converted_by
        
        db.add(lead)
        db.commit()
        
        # Emit lead.converted_to_deal event
        self._emit_lead_converted(db, lead, deal, converted_by)
        
        return {
            "customer_id": customer_id,
            "deal_id": deal.id,
            "lead_id": lead.id
        }
    
    def _emit_lead_converted(
        self,
        db: Session,
        lead: Lead,
        deal,
        actor_user_id: Optional[UUID]
    ) -> None:
        """Emit lead.converted_to_deal event."""
        from .event_service import event_service
        from .event_catalog import EventCode
        
        event_service.emit_event(
            db,
            event_code=EventCode.LEAD_CONVERTED_TO_DEAL,
            org_id=lead.org_id,
            aggregate_type="lead",
            aggregate_id=lead.id,
            payload={
                "lead_code": lead.lead_code,
                "contact_name": lead.contact_name,
                "deal_id": str(deal.id),
                "deal_code": deal.deal_code,
                "entity_name": lead.lead_code,
            },
            actor_user_id=actor_user_id,
            actor_type="user",
            entity_code=lead.lead_code,
            entity_name=lead.contact_name or lead.lead_code,
            related_customer_id=lead.customer_id,
            related_deal_id=deal.id,
        )
        db.commit()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ASSIGNMENT
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
    ) -> Optional[Lead]:
        """Assign lead to a user/unit."""
        lead = self.get(db, id=id, org_id=org_id)
        if not lead:
            return None
        
        lead.owner_user_id = owner_user_id
        lead.owner_unit_id = owner_unit_id
        lead.assigned_at = utc_now()
        
        if assigned_by:
            lead.updated_by = assigned_by
        
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    
    def get_by_owner(
        self,
        db: Session,
        *,
        org_id: UUID,
        owner_user_id: UUID,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Lead], int]:
        """Get leads owned by a user."""
        filters = {"owner_user_id": owner_user_id}
        if status:
            filters["lead_status"] = status
        
        return self.get_multi(db, org_id=org_id, skip=skip, limit=limit, filters=filters)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SEARCH & FILTER
    # ═══════════════════════════════════════════════════════════════════════════
    
    def search(
        self,
        db: Session,
        *,
        org_id: UUID,
        query: str,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Lead], int]:
        """Search leads by name, phone, email."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            search=query,
            search_fields=["contact_name", "contact_phone", "contact_email", "lead_code"]
        )
    
    def get_by_status(
        self,
        db: Session,
        *,
        org_id: UUID,
        status: str,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Lead], int]:
        """Get leads by status."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"lead_status": status}
        )
    
    def get_by_source(
        self,
        db: Session,
        *,
        org_id: UUID,
        source_channel: str,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Lead], int]:
        """Get leads by source channel."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"source_channel": source_channel}
        )


# Singleton instance
lead_service = LeadService()
