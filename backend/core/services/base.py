"""
ProHouzing Core Services - Base Service
Version: 2.0.0 (Visibility Filter Enabled)

Generic CRUD operations with:
- Multi-tenant (org_id filtering)
- Soft delete
- Audit trail
- Pagination
- RBAC support
- DATA VISIBILITY FILTER (owner-based access control)
"""

from typing import TypeVar, Generic, Optional, List, Type, Any, Dict
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..models.base import SoftDeleteModel, CoreModel, utc_now, GUID
from ..schemas.base import PaginationMeta, ListQueryParams
from .permission import permission_service, PermissionScope

# Type variables for generic service
ModelType = TypeVar("ModelType", bound=CoreModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base service class with generic CRUD operations.
    
    Features:
    - Multi-tenant filtering (org_id)
    - Soft delete support
    - Audit trail (created_by, updated_by)
    - Pagination
    - Search and filtering
    """
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CREATE
    # ═══════════════════════════════════════════════════════════════════════════
    
    def create(
        self,
        db: Session,
        *,
        obj_in: CreateSchemaType,
        org_id: UUID,
        created_by: Optional[UUID] = None
    ) -> ModelType:
        """
        Create a new record.
        
        Args:
            db: Database session
            obj_in: Pydantic schema with create data
            org_id: Organization ID (multi-tenant)
            created_by: User ID who created this record
        
        Returns:
            Created model instance
        """
        obj_data = obj_in.model_dump(exclude_unset=True)
        
        # Set org_id if model has it
        if hasattr(self.model, 'org_id'):
            obj_data['org_id'] = org_id
        
        # Set audit fields
        if created_by:
            obj_data['created_by'] = created_by
            obj_data['updated_by'] = created_by
        
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def create_many(
        self,
        db: Session,
        *,
        objs_in: List[CreateSchemaType],
        org_id: UUID,
        created_by: Optional[UUID] = None
    ) -> List[ModelType]:
        """Bulk create records."""
        db_objs = []
        for obj_in in objs_in:
            obj_data = obj_in.model_dump(exclude_unset=True)
            if hasattr(self.model, 'org_id'):
                obj_data['org_id'] = org_id
            if created_by:
                obj_data['created_by'] = created_by
                obj_data['updated_by'] = created_by
            db_objs.append(self.model(**obj_data))
        
        db.add_all(db_objs)
        db.commit()
        for obj in db_objs:
            db.refresh(obj)
        return db_objs
    
    # ═══════════════════════════════════════════════════════════════════════════
    # READ
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        include_deleted: bool = False
    ) -> Optional[ModelType]:
        """
        Get a single record by ID.
        
        Args:
            db: Database session
            id: Record ID
            org_id: Organization ID (multi-tenant filter)
            include_deleted: Include soft-deleted records
        
        Returns:
            Model instance or None
        """
        query = select(self.model).where(self.model.id == id)
        
        # Multi-tenant filter
        if hasattr(self.model, 'org_id'):
            query = query.where(self.model.org_id == org_id)
        
        # Soft delete filter
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        result = db.execute(query)
        return result.scalar_one_or_none()
    
    def get_by_code(
        self,
        db: Session,
        *,
        code: str,
        code_field: str,
        org_id: UUID,
        include_deleted: bool = False
    ) -> Optional[ModelType]:
        """Get a record by its code field."""
        query = select(self.model).where(
            getattr(self.model, code_field) == code
        )
        
        if hasattr(self.model, 'org_id'):
            query = query.where(self.model.org_id == org_id)
        
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        result = db.execute(query)
        return result.scalar_one_or_none()
    
    def get_multi(
        self,
        db: Session,
        *,
        org_id: UUID,
        user_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        search_fields: Optional[List[str]] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        include_deleted: bool = False,
        bypass_visibility: bool = False
    ) -> tuple[List[ModelType], int]:
        """
        Get multiple records with pagination, filtering, search, and VISIBILITY FILTER.
        
        Args:
            db: Database session
            org_id: Organization ID
            user_id: Current user ID (REQUIRED for visibility filter)
            skip: Offset for pagination
            limit: Number of records to return
            filters: Dictionary of field=value filters
            search: Search query string
            search_fields: Fields to search in
            sort_by: Field to sort by
            sort_order: 'asc' or 'desc'
            include_deleted: Include soft-deleted records
            bypass_visibility: Skip visibility filter (DANGEROUS - admin only)
        
        Returns:
            Tuple of (list of records, total count)
        """
        # Base query
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)
        
        # Multi-tenant filter
        if hasattr(self.model, 'org_id'):
            query = query.where(self.model.org_id == org_id)
            count_query = count_query.where(self.model.org_id == org_id)
        
        # Soft delete filter
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
            count_query = count_query.where(self.model.deleted_at.is_(None))
        
        # ═══════════════════════════════════════════════════════════════════════
        # VISIBILITY FILTER - Apply ownership-based data access control
        # ═══════════════════════════════════════════════════════════════════════
        if user_id and not bypass_visibility:
            visibility_conditions = self._build_visibility_conditions(db, user_id, org_id)
            if visibility_conditions is not None:
                query = query.where(visibility_conditions)
                count_query = count_query.where(visibility_conditions)
        
        # Apply filters
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    query = query.where(getattr(self.model, field) == value)
                    count_query = count_query.where(getattr(self.model, field) == value)
        
        # Apply search
        if search and search_fields:
            search_conditions = []
            for field in search_fields:
                if hasattr(self.model, field):
                    search_conditions.append(
                        getattr(self.model, field).ilike(f"%{search}%")
                    )
            if search_conditions:
                query = query.where(or_(*search_conditions))
                count_query = count_query.where(or_(*search_conditions))
        
        # Get total count
        total = db.execute(count_query).scalar() or 0
        
        # Apply sorting
        if sort_by and hasattr(self.model, sort_by):
            sort_column = getattr(self.model, sort_by)
            if sort_order == "asc":
                query = query.order_by(sort_column.asc())
            else:
                query = query.order_by(sort_column.desc())
        elif hasattr(self.model, 'created_at'):
            query = query.order_by(self.model.created_at.desc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute
        result = db.execute(query)
        items = list(result.scalars().all())
        
        return items, total
    
    def _build_visibility_conditions(
        self,
        db: Session,
        user_id: UUID,
        org_id: UUID
    ):
        """
        Build SQLAlchemy conditions for visibility filter.
        
        Logic:
        - SELF scope: Only records where user is owner/creator
        - TEAM scope: Records owned by user or team members
        - BRANCH scope: Records in same branch/unit
        - ORGANIZATION/GLOBAL: No filter (see all in org)
        
        Returns:
            SQLAlchemy condition or None (no filter needed)
        """
        # Get user scope
        user_scope = permission_service.get_user_scope(db, user_id, org_id)
        scope = user_scope.get("scope", PermissionScope.SELF)
        
        # Global/Org scope = no visibility filter
        if scope in [PermissionScope.GLOBAL, PermissionScope.ORGANIZATION]:
            return None
        
        # Build ownership conditions based on scope
        owner_conditions = []
        
        # SELF scope - only own records
        if scope == PermissionScope.SELF:
            if hasattr(self.model, "owner_user_id"):
                owner_conditions.append(self.model.owner_user_id == user_id)
            if hasattr(self.model, "created_by"):
                owner_conditions.append(self.model.created_by == user_id)
            if hasattr(self.model, "assigned_to"):
                owner_conditions.append(self.model.assigned_to == user_id)
            if hasattr(self.model, "sales_user_id"):
                owner_conditions.append(self.model.sales_user_id == user_id)
        
        # TEAM/UNIT scope - own + subordinates
        elif scope in [PermissionScope.TEAM, PermissionScope.UNIT]:
            subordinate_ids = user_scope.get("subordinate_user_ids", [])
            all_user_ids = [user_id] + subordinate_ids
            
            if hasattr(self.model, "owner_user_id"):
                owner_conditions.append(self.model.owner_user_id.in_(all_user_ids))
            if hasattr(self.model, "created_by"):
                owner_conditions.append(self.model.created_by.in_(all_user_ids))
            if hasattr(self.model, "assigned_to"):
                owner_conditions.append(self.model.assigned_to.in_(all_user_ids))
            if hasattr(self.model, "sales_user_id"):
                owner_conditions.append(self.model.sales_user_id.in_(all_user_ids))
        
        # BRANCH scope - own + subordinates + unit members
        elif scope == PermissionScope.BRANCH:
            unit_ids = user_scope.get("unit_ids", [])
            subordinate_ids = user_scope.get("subordinate_user_ids", [])
            all_user_ids = [user_id] + subordinate_ids
            
            if hasattr(self.model, "owner_user_id"):
                owner_conditions.append(self.model.owner_user_id.in_(all_user_ids))
            if hasattr(self.model, "sales_user_id"):
                owner_conditions.append(self.model.sales_user_id.in_(all_user_ids))
            if hasattr(self.model, "owner_unit_id") and unit_ids:
                owner_conditions.append(self.model.owner_unit_id.in_(unit_ids))
        
        # If no ownership fields exist, return None (no filter possible)
        if not owner_conditions:
            return None
        
        # Combine with OR - user can see if ANY condition matches
        return or_(*owner_conditions)
    
    def can_access_entity(
        self,
        db: Session,
        *,
        entity,
        user_id: UUID,
        org_id: UUID
    ) -> bool:
        """
        Check if user can access a specific entity based on visibility scope.
        
        Returns:
            True if user can access, False otherwise
        """
        if not entity:
            return False
        
        # Get user scope
        user_scope = permission_service.get_user_scope(db, user_id, org_id)
        scope = user_scope.get("scope", PermissionScope.SELF)
        
        # Global/Org scope = can access anything in org
        if scope in [PermissionScope.GLOBAL, PermissionScope.ORGANIZATION]:
            return True
        
        # Get subordinate IDs for team/branch scope
        subordinate_ids = user_scope.get("subordinate_user_ids", [])
        all_user_ids = [user_id] + [str(uid) if isinstance(uid, UUID) else uid for uid in subordinate_ids]
        
        # Convert all to strings for comparison
        all_user_ids_str = [str(uid) for uid in all_user_ids]
        
        # Check ownership fields
        owner_user_id = getattr(entity, "owner_user_id", None)
        created_by = getattr(entity, "created_by", None)
        assigned_to = getattr(entity, "assigned_to", None)
        sales_user_id = getattr(entity, "sales_user_id", None)
        
        # Check if user is owner
        if owner_user_id and str(owner_user_id) in all_user_ids_str:
            return True
        if created_by and str(created_by) in all_user_ids_str:
            return True
        if assigned_to and str(assigned_to) in all_user_ids_str:
            return True
        if sales_user_id and str(sales_user_id) in all_user_ids_str:
            return True
        
        # For BRANCH scope, also check unit membership
        if scope == PermissionScope.BRANCH:
            unit_ids = user_scope.get("unit_ids", [])
            owner_unit_id = getattr(entity, "owner_unit_id", None)
            if owner_unit_id and owner_unit_id in unit_ids:
                return True
        
        return False
    
    def get_all(
        self,
        db: Session,
        *,
        org_id: UUID,
        include_deleted: bool = False
    ) -> List[ModelType]:
        """Get all records (use with caution on large tables)."""
        query = select(self.model)
        
        if hasattr(self.model, 'org_id'):
            query = query.where(self.model.org_id == org_id)
        
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        result = db.execute(query)
        return list(result.scalars().all())
    
    # ═══════════════════════════════════════════════════════════════════════════
    # UPDATE
    # ═══════════════════════════════════════════════════════════════════════════
    
    def update(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        obj_in: UpdateSchemaType,
        updated_by: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """
        Update a record.
        
        Args:
            db: Database session
            id: Record ID
            org_id: Organization ID
            obj_in: Pydantic schema with update data
            updated_by: User ID who updated this record
        
        Returns:
            Updated model instance or None if not found
        """
        db_obj = self.get(db, id=id, org_id=org_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Set audit field
        if updated_by:
            update_data['updated_by'] = updated_by
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_field(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        field: str,
        value: Any,
        updated_by: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """Update a single field."""
        db_obj = self.get(db, id=id, org_id=org_id)
        if not db_obj:
            return None
        
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)
        
        if updated_by and hasattr(db_obj, 'updated_by'):
            db_obj.updated_by = updated_by
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DELETE (SOFT)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def delete(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        deleted_by: Optional[UUID] = None
    ) -> bool:
        """
        Soft delete a record (set deleted_at).
        
        Args:
            db: Database session
            id: Record ID
            org_id: Organization ID
            deleted_by: User ID who deleted this record
        
        Returns:
            True if deleted, False if not found
        """
        db_obj = self.get(db, id=id, org_id=org_id)
        if not db_obj:
            return False
        
        if hasattr(db_obj, 'deleted_at'):
            db_obj.deleted_at = utc_now()
        
        if hasattr(db_obj, 'status'):
            db_obj.status = "deleted"
        
        if deleted_by and hasattr(db_obj, 'updated_by'):
            db_obj.updated_by = deleted_by
        
        db.add(db_obj)
        db.commit()
        return True
    
    def restore(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        restored_by: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """Restore a soft-deleted record."""
        db_obj = self.get(db, id=id, org_id=org_id, include_deleted=True)
        if not db_obj:
            return None
        
        if hasattr(db_obj, 'deleted_at'):
            db_obj.deleted_at = None
        
        if hasattr(db_obj, 'status'):
            db_obj.status = "active"
        
        if restored_by and hasattr(db_obj, 'updated_by'):
            db_obj.updated_by = restored_by
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HELPERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def exists(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID
    ) -> bool:
        """Check if a record exists."""
        return self.get(db, id=id, org_id=org_id) is not None
    
    def count(
        self,
        db: Session,
        *,
        org_id: UUID,
        filters: Optional[Dict[str, Any]] = None,
        include_deleted: bool = False
    ) -> int:
        """Count records with optional filters."""
        query = select(func.count()).select_from(self.model)
        
        if hasattr(self.model, 'org_id'):
            query = query.where(self.model.org_id == org_id)
        
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    query = query.where(getattr(self.model, field) == value)
        
        return db.execute(query).scalar() or 0
    
    def build_pagination_meta(
        self,
        total: int,
        page: int,
        limit: int
    ) -> PaginationMeta:
        """Build pagination metadata."""
        total_pages = (total + limit - 1) // limit if limit > 0 else 0
        return PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
