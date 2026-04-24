"""
ProHouzing Core Models Package
Version: 1.0.0

All SQLAlchemy models for the PostgreSQL-based Master Data Model.
"""

# Base and utilities
from .base import (
    CoreModel,
    OrgScopedModel,
    SoftDeleteModel,
    TimestampMixin,
    AuditMixin,
    SoftDeleteMixin,
    OrgScopeMixin,
    StatusMixin,
    CodeMixin,
    GUID,
    JSONB,
    ARRAY,
    JSONArray,
    generate_uuid,
    utc_now,
    generate_code,
    normalize_phone,
    normalize_email,
)

# Organization Domain
from .organization import Organization, OrganizationalUnit

# User Domain
from .user import User, UserMembership

# Customer Domain
from .customer import Customer, CustomerIdentity, CustomerAddress

# Product Domain
from .product import Project, ProjectStructure, Product, ProductPriceHistory

# Lead Domain
from .lead import Lead

# Deal Domain
from .deal import Deal

# Booking Domain
from .booking import Booking

# Deposit Domain
from .deposit import Deposit

# Contract Domain
from .contract import Contract

# Payment Domain
from .payment import Payment, PaymentScheduleItem

# Commission Domain
from .commission import CommissionEntry, CommissionRule

# Partner Domain
from .partner import Partner, PartnerContract

# Assignment Domain
from .assignment import Assignment

# Task Domain
from .task import Task

# Activity Domain
from .activity import ActivityLog

# Event Domain (Legacy)
from .event import DomainEvent

# Event Domain v2 (Prompt 2/18) - New tables only
from .events_v2 import (
    ActivityStreamItem,
    EntityChangeLog,
    EventSubscription,
    EventDeliveryLog,
    EventCategory as EventCategoryEnum,
    EventVisibility,
    ProcessingStatus,
    ActorType,
    SourceType,
    SeverityLevel,
    ChangeSource,
)

# Master Data Domain (Prompt 3/20) - Dynamic Data Foundation
from .master_data import MasterDataCategory, MasterDataItem

# Tag System (Prompt 3/20 - Phase 2)
from .tags import Tag, EntityTag

# Attribute Engine (Prompt 3/20 - Phase 3)
from .attributes import EntityAttribute, EntityAttributeValue, AttributeDataType, AttributeScope

# Form Schema (Prompt 3/20 - Phase 4)
from .forms import FormSchema, FormSection, FormField, FormType, FieldLayout

# Approval System (Prompt 4/20 - HARDENED)
from .approval import (
    ApprovalRequest,
    ApprovalStep,
    ApprovalHistory,
    ApprovalStatus,
    StepStatus,
    WORKFLOW_TEMPLATES,
)

# Company Config (Prompt 4/20 - Multi-Company)
from .company_config import (
    CompanySettings,
    RoleTemplate,
    RolePermissionOverride,
)


# All models for easy import
__all__ = [
    # Base
    "CoreModel",
    "OrgScopedModel",
    "SoftDeleteModel",
    "TimestampMixin",
    "AuditMixin",
    "SoftDeleteMixin",
    "OrgScopeMixin",
    "StatusMixin",
    "CodeMixin",
    "GUID",
    "JSONB",
    "ARRAY",
    "JSONArray",
    "generate_uuid",
    "utc_now",
    "generate_code",
    "normalize_phone",
    "normalize_email",
    # Organization
    "Organization",
    "OrganizationalUnit",
    # User
    "User",
    "UserMembership",
    # Customer
    "Customer",
    "CustomerIdentity",
    "CustomerAddress",
    # Product
    "Project",
    "ProjectStructure",
    "Product",
    "ProductPriceHistory",
    # Lead
    "Lead",
    # Deal
    "Deal",
    # Booking
    "Booking",
    # Deposit
    "Deposit",
    # Contract
    "Contract",
    # Payment
    "Payment",
    "PaymentScheduleItem",
    # Commission
    "CommissionEntry",
    "CommissionRule",
    # Partner
    "Partner",
    "PartnerContract",
    # Assignment
    "Assignment",
    # Task
    "Task",
    # Activity
    "ActivityLog",
    # Event (Legacy)
    "DomainEvent",
    # Event v2 (Prompt 2/18) - New tables
    "ActivityStreamItem",
    "EntityChangeLog",
    "EventSubscription",
    "EventDeliveryLog",
    "EventCategoryEnum",
    "EventVisibility",
    "ProcessingStatus",
    "ActorType",
    "SourceType",
    "SeverityLevel",
    "ChangeSource",
    # Master Data (Prompt 3/20)
    "MasterDataCategory",
    "MasterDataItem",
    # Tags (Prompt 3/20 - Phase 2)
    "Tag",
    "EntityTag",
    # Attributes (Prompt 3/20 - Phase 3)
    "EntityAttribute",
    "EntityAttributeValue",
    "AttributeDataType",
    "AttributeScope",
    # Forms (Prompt 3/20 - Phase 4)
    "FormSchema",
    "FormSection",
    "FormField",
    "FormType",
    "FieldLayout",
    # Approval System (Prompt 4/20 - HARDENED)
    "ApprovalRequest",
    "ApprovalStep",
    "ApprovalHistory",
    "ApprovalStatus",
    "StepStatus",
    "WORKFLOW_TEMPLATES",
    # Company Config (Prompt 4/20 - Multi-Company)
    "CompanySettings",
    "RoleTemplate",
    "RolePermissionOverride",
]
