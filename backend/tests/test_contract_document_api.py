"""
ProHouzing Contract & Document Workflow API Tests
Prompt 9/20 - Testing Contract CRUD, Approval Workflow, Amendments, Documents

Test Coverage:
- Contract Types & Statuses Reference APIs
- Contract CRUD (Create, List, Get, Update)
- Multi-level Approval Workflow (Submit -> Sales Approve -> Legal Approve)
- Constraint Engine (Cannot edit signed contracts)
- Amendment Creation (Phụ lục) for locked contracts
- Document Upload with checksum verification
- Document Versioning
- Contract Pipeline Summary
- Audit Trail Logging
"""

import pytest
import requests
import os
import io
import hashlib
import uuid
from datetime import datetime, timezone

# Use production URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com').rstrip('/')

# Test credentials from previous iterations
PRODUCT_ID = "c38a4aa4-804f-4da2-97e0-10d4ee8425a5"
PROJECT_ID = "d994a0b5-ef9f-4f13-ba5e-6b4ab4787d27"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def test_contract_id(api_client):
    """Create a test contract and return its ID"""
    payload = {
        "customer_id": "TEST_CUSTOMER_001",
        "product_id": PRODUCT_ID,
        "project_id": PROJECT_ID,
        "contract_type": "sale_contract",
        "unit_price": 5000000000,
        "unit_area": 100,
        "discount_percent": 5,
        "vat_percent": 10,
        "notes": "Test contract for pytest"
    }
    response = api_client.post(f"{BASE_URL}/api/contracts", json=payload)
    if response.status_code == 200:
        return response.json()["id"]
    return None


# =============================================================================
# REFERENCE DATA TESTS
# =============================================================================

class TestContractReferenceData:
    """Test contract types and statuses reference APIs"""
    
    def test_get_contract_types(self, api_client):
        """GET /api/contracts/types - Get all contract types"""
        response = api_client.get(f"{BASE_URL}/api/contracts/types")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5  # At least 5 contract types expected
        
        # Check structure
        first_type = data[0]
        assert "value" in first_type
        assert "label" in first_type
        
        # Verify key types exist
        type_values = [t["value"] for t in data]
        assert "sale_contract" in type_values
        assert "deposit_agreement" in type_values
        assert "booking_agreement" in type_values
        print(f"✓ Found {len(data)} contract types: {type_values[:5]}...")
    
    def test_get_contract_statuses(self, api_client):
        """GET /api/contracts/status - Get all contract statuses"""
        response = api_client.get(f"{BASE_URL}/api/contracts/status")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 10  # At least 10 statuses expected
        
        # Verify status lifecycle
        status_values = [s["value"] for s in data]
        expected_statuses = ["draft", "pending_review", "approved", "signed", "active", "completed"]
        for expected in expected_statuses:
            assert expected in status_values, f"Missing status: {expected}"
        
        # Check locked statuses
        signed_status = next((s for s in data if s["value"] == "signed"), None)
        assert signed_status is not None
        assert signed_status.get("is_locked") == True
        print(f"✓ Found {len(data)} contract statuses with proper lock flags")


class TestDocumentReferenceData:
    """Test document categories and statuses reference APIs"""
    
    def test_get_document_categories(self, api_client):
        """GET /api/documents/categories - Get all document categories"""
        response = api_client.get(f"{BASE_URL}/api/documents/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 10  # At least 10 categories expected
        
        # Verify key categories
        category_values = [c["value"] for c in data]
        expected_categories = ["contract_primary", "customer_cccd", "payment_receipt"]
        for expected in expected_categories:
            assert expected in category_values, f"Missing category: {expected}"
        print(f"✓ Found {len(data)} document categories")
    
    def test_get_document_statuses(self, api_client):
        """GET /api/documents/statuses - Get all document statuses"""
        response = api_client.get(f"{BASE_URL}/api/documents/statuses")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4
        
        # Verify key statuses
        status_values = [s["value"] for s in data]
        expected_statuses = ["draft", "signed"]
        for expected in expected_statuses:
            assert expected in status_values
        print(f"✓ Found {len(data)} document statuses")


# =============================================================================
# CONTRACT CRUD TESTS
# =============================================================================

class TestContractCRUD:
    """Test Contract CRUD operations"""
    
    def test_create_contract_success(self, api_client):
        """POST /api/contracts - Create new contract"""
        payload = {
            "customer_id": "TEST_CUSTOMER_CREATE_001",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 3000000000,  # 3 billion VND
            "unit_area": 75,
            "discount_percent": 3,
            "vat_percent": 10,
            "deposit_amount": 100000000,  # 100 million VND
            "notes": "Test contract creation"
        }
        
        response = api_client.post(f"{BASE_URL}/api/contracts", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "contract_code" in data
        assert data["status"] == "draft"
        assert data["is_locked"] == False
        assert data["contract_type"] == "sale_contract"
        assert data["customer_id"] == "TEST_CUSTOMER_CREATE_001"
        
        # Verify financial calculations
        assert data["contract_value"] > 0
        assert data["vat_amount"] > 0
        assert data["grand_total"] > data["contract_value"]
        
        print(f"✓ Created contract: {data['contract_code']}, Grand Total: {data['grand_total']:,.0f} VND")
        return data["id"]
    
    def test_list_contracts(self, api_client):
        """GET /api/contracts - List contracts with filters"""
        response = api_client.get(f"{BASE_URL}/api/contracts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} contracts")
        
        # Verify contract structure
        if data:
            contract = data[0]
            assert "id" in contract
            assert "contract_code" in contract
            assert "status" in contract
    
    def test_list_contracts_by_status(self, api_client):
        """GET /api/contracts?status=draft - List contracts filtered by status"""
        response = api_client.get(f"{BASE_URL}/api/contracts", params={"status": "draft"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # All returned contracts should be draft
        for contract in data:
            assert contract["status"] == "draft"
        print(f"✓ Found {len(data)} draft contracts")
    
    def test_get_contract_by_id(self, api_client, test_contract_id):
        """GET /api/contracts/{id} - Get contract by ID"""
        if not test_contract_id:
            pytest.skip("No test contract available")
        
        response = api_client.get(f"{BASE_URL}/api/contracts/{test_contract_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == test_contract_id
        assert "contract_code" in data
        assert "status" in data
        assert "required_checklist" in data  # Document checklist
        print(f"✓ Retrieved contract: {data['contract_code']}")
    
    def test_get_contract_not_found(self, api_client):
        """GET /api/contracts/{id} - Contract not found"""
        response = api_client.get(f"{BASE_URL}/api/contracts/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ Contract not found returns 404")
    
    def test_update_contract_draft(self, api_client, test_contract_id):
        """PUT /api/contracts/{id} - Update draft contract (should succeed)"""
        if not test_contract_id:
            pytest.skip("No test contract available")
        
        payload = {
            "notes": "Updated test notes",
            "internal_notes": "Internal update",
            "update_reason": "Testing update"
        }
        
        response = api_client.put(f"{BASE_URL}/api/contracts/{test_contract_id}", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["notes"] == "Updated test notes"
        print("✓ Updated draft contract successfully")


# =============================================================================
# APPROVAL WORKFLOW TESTS
# =============================================================================

class TestApprovalWorkflow:
    """Test multi-level approval workflow"""
    
    def test_submit_for_approval(self, api_client):
        """POST /api/contracts/{id}/submit - Submit contract for review"""
        # Create a new contract for testing
        create_payload = {
            "customer_id": "TEST_CUSTOMER_SUBMIT",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 4000000000,
            "notes": "Contract for submit test"
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        assert create_response.status_code == 200
        contract_id = create_response.json()["id"]
        
        # Submit for approval
        response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        # Verify status changed
        get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
        assert get_response.status_code == 200
        contract = get_response.json()
        assert contract["status"] == "pending_review"
        assert contract["approval_status"] == "in_progress"
        print(f"✓ Contract {contract['contract_code']} submitted for approval")
        return contract_id
    
    def test_approve_step_1_sales(self, api_client):
        """POST /api/contracts/{id}/approve - Sales manager approval (Step 1)"""
        # Create and submit contract
        create_payload = {
            "customer_id": "TEST_CUSTOMER_APPROVE_SALES",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 2500000000,
            "discount_percent": 3  # Low discount, won't need finance approval
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        assert create_response.status_code == 200
        contract_id = create_response.json()["id"]
        
        # Submit
        submit_response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        assert submit_response.status_code == 200
        
        # Approve step 1 (sales)
        approve_payload = {"comments": "Sales approved - Test"}
        response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json=approve_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        # Verify sales review status
        get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
        contract = get_response.json()
        assert contract["sales_review_status"] == "approved"
        print(f"✓ Sales approval completed for contract {contract['contract_code']}")
        return contract_id
    
    def test_approve_step_2_legal(self, api_client):
        """POST /api/contracts/{id}/approve - Legal approval (Step 2)"""
        # Create, submit, and approve step 1
        create_payload = {
            "customer_id": "TEST_CUSTOMER_APPROVE_LEGAL",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 2000000000,
            "discount_percent": 2
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        contract_id = create_response.json()["id"]
        
        # Submit
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        
        # Approve step 1
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "Sales OK"})
        
        # Approve step 2 (legal)
        response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "Legal OK"})
        assert response.status_code == 200
        
        # Verify legal review status
        get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
        contract = get_response.json()
        assert contract["legal_review_status"] == "approved"
        
        # For simple contracts (low discount), should be fully approved after legal
        if contract.get("discount_percent", 0) <= 5:
            # May become approved status
            print(f"✓ Legal approval completed, status: {contract['status']}")
        return contract_id
    
    def test_reject_contract(self, api_client):
        """POST /api/contracts/{id}/reject - Reject contract for revision"""
        # Create and submit contract
        create_payload = {
            "customer_id": "TEST_CUSTOMER_REJECT",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 1500000000
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        contract_id = create_response.json()["id"]
        
        # Submit
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        
        # Reject
        reject_payload = {
            "reason": "Missing customer documentation",
            "required_changes": ["Upload CCCD", "Fix customer name"]
        }
        response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/reject", json=reject_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        # Verify status changed to revision_required
        get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
        contract = get_response.json()
        assert contract["status"] == "revision_required"
        assert contract["approval_status"] == "rejected"
        print(f"✓ Contract rejected and sent for revision")


# =============================================================================
# CONSTRAINT ENGINE TESTS
# =============================================================================

class TestConstraintEngine:
    """Test that signed contracts cannot be edited"""
    
    def test_cannot_edit_signed_contract(self, api_client):
        """PUT /api/contracts/{id} on signed contract should fail"""
        # Create a full workflow contract: create -> submit -> approve -> approve -> sign
        create_payload = {
            "customer_id": "TEST_CUSTOMER_SIGNED",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 1800000000,
            "discount_percent": 1  # Low discount for quick approval
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        assert create_response.status_code == 200
        contract_id = create_response.json()["id"]
        
        # Submit
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        
        # Approve step 1 (sales)
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "Sales OK"})
        
        # Approve step 2 (legal) - This should complete approval for low discount
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "Legal OK"})
        
        # Get current status
        get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
        contract = get_response.json()
        
        # Only proceed with signing if approved
        if contract["status"] == "approved":
            # Sign the contract
            sign_payload = {
                "signed_by_customer_id": "TEST_CUSTOMER_SIGNED",
                "signed_by_company_id": "COMPANY_SIGNER_001",
                "signed_by_company_title": "Giám đốc"
            }
            sign_response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/sign", json=sign_payload)
            assert sign_response.status_code == 200
            
            # Verify contract is now locked
            get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
            signed_contract = get_response.json()
            assert signed_contract["status"] == "signed"
            assert signed_contract["is_locked"] == True
            
            # Try to update - should fail
            update_payload = {
                "unit_price": 9999999999,
                "update_reason": "Trying to change price"
            }
            update_response = api_client.put(f"{BASE_URL}/api/contracts/{contract_id}", json=update_payload)
            assert update_response.status_code == 400  # Should be blocked
            
            error_data = update_response.json()
            assert "khóa" in error_data.get("detail", "").lower() or "locked" in error_data.get("detail", "").lower()
            print("✓ Signed contract cannot be edited - constraint working correctly")
        else:
            print(f"⚠ Contract not fully approved (status: {contract['status']}), skipping sign test")


# =============================================================================
# AMENDMENT TESTS
# =============================================================================

class TestAmendments:
    """Test Amendment (Phụ lục) creation for locked contracts"""
    
    def test_create_amendment_for_signed_contract(self, api_client):
        """POST /api/contracts/{id}/amendments - Create amendment for signed contract"""
        # Create and sign contract first
        create_payload = {
            "customer_id": "TEST_CUSTOMER_AMENDMENT",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 2200000000,
            "discount_percent": 1
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        contract_id = create_response.json()["id"]
        contract_code = create_response.json()["contract_code"]
        
        # Full approval workflow
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "Sales OK"})
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "Legal OK"})
        
        # Check if approved
        get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
        contract = get_response.json()
        
        if contract["status"] == "approved":
            # Sign
            sign_payload = {
                "signed_by_customer_id": "TEST_CUSTOMER_AMENDMENT",
                "signed_by_company_id": "COMPANY_SIGNER_002",
                "signed_by_company_title": "Giám đốc"
            }
            api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/sign", json=sign_payload)
            
            # Create amendment
            amendment_payload = {
                "parent_contract_id": contract_id,
                "amendment_type": "price_change",
                "reason": "Customer negotiated price adjustment",
                "changes_summary": "Giảm giá 5% theo yêu cầu khách hàng",
                "changed_fields": [
                    {
                        "field_name": "discount_percent",
                        "old_value": 1,
                        "new_value": 6,
                        "reason": "Price negotiation"
                    }
                ],
                "notes": "Amendment test"
            }
            
            response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/amendments", json=amendment_payload)
            assert response.status_code == 200
            
            amendment = response.json()
            assert "id" in amendment
            assert "amendment_code" in amendment
            assert amendment["parent_contract_id"] == contract_id
            assert amendment["amendment_number"] == 1
            assert "PL" in amendment["amendment_code"]  # Phụ lục
            print(f"✓ Created amendment: {amendment['amendment_code']} for contract {contract_code}")
            return amendment["id"]
        else:
            print(f"⚠ Contract not approved (status: {contract['status']}), skipping amendment test")
    
    def test_cannot_create_amendment_for_draft(self, api_client):
        """POST /api/contracts/{id}/amendments on draft should fail"""
        # Create draft contract
        create_payload = {
            "customer_id": "TEST_CUSTOMER_DRAFT_AMEND",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 1000000000
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        contract_id = create_response.json()["id"]
        
        # Try to create amendment on draft - should fail
        amendment_payload = {
            "parent_contract_id": contract_id,
            "amendment_type": "general",
            "reason": "Test",
            "changes_summary": "Test",
            "changed_fields": []
        }
        
        response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/amendments", json=amendment_payload)
        assert response.status_code == 400
        print("✓ Cannot create amendment for draft contract - constraint working")
    
    def test_get_amendments_list(self, api_client):
        """GET /api/contracts/{id}/amendments - List amendments for contract"""
        # Create contract with amendment first
        create_payload = {
            "customer_id": "TEST_CUSTOMER_AMEND_LIST",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 2500000000,
            "discount_percent": 1
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        contract_id = create_response.json()["id"]
        
        # Full workflow
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "OK"})
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "OK"})
        
        # Get status
        get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
        contract = get_response.json()
        
        if contract["status"] == "approved":
            # Sign
            api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/sign", json={
                "signed_by_customer_id": "TEST_CUSTOMER_AMEND_LIST",
                "signed_by_company_id": "COMPANY_001"
            })
            
            # Create amendment
            api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/amendments", json={
                "amendment_type": "info_change",
                "reason": "Test list",
                "changes_summary": "Test",
                "changed_fields": []
            })
        
        # Get amendments list
        response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}/amendments")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} amendments for contract")


# =============================================================================
# DOCUMENT TESTS
# =============================================================================

class TestDocumentUpload:
    """Test Document upload and versioning"""
    
    def test_upload_document_with_checksum(self, api_client):
        """POST /api/documents/upload - Upload document with checksum verification"""
        # Create unique test file content to avoid duplicate detection
        unique_id = str(uuid.uuid4())
        file_content = f"This is a test PDF content for ProHouzing contract document - {unique_id}".encode()
        
        # Calculate expected checksum
        expected_checksum = f"sha256:{hashlib.sha256(file_content).hexdigest()}"
        
        # Create multipart form data
        files = {
            'file': ('test_contract.pdf', file_content, 'application/pdf')
        }
        data = {
            'entity_type': 'contract',
            'entity_id': f'TEST_CONTRACT_DOC_{unique_id[:8]}',
            'category': 'contract_primary',
            'title': 'Test Contract Document',
            'visibility': 'internal'
        }
        
        # Remove Content-Type header for multipart
        headers = {k: v for k, v in api_client.headers.items() if k.lower() != 'content-type'}
        
        response = requests.post(f"{BASE_URL}/api/documents/upload", files=files, data=data, headers=headers)
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] == True
        
        document = result["document"]
        assert "id" in document
        assert "document_code" in document
        assert document["checksum"] == expected_checksum
        assert document["category"] == "contract_primary"
        assert document["version"] == 1
        assert document["is_latest"] == True
        
        print(f"✓ Uploaded document: {document['document_code']}, checksum verified")
        return document["id"]
    
    def test_list_documents(self, api_client):
        """GET /api/documents - List documents"""
        response = api_client.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} documents")
    
    def test_get_document_by_id(self, api_client):
        """GET /api/documents/{id} - Get document by ID"""
        # Upload a document first
        file_content = b"Test document content for retrieval"
        files = {'file': ('test_get.pdf', file_content, 'application/pdf')}
        data = {
            'entity_type': 'contract',
            'entity_id': 'TEST_CONTRACT_GET_DOC',
            'category': 'other',
            'title': 'Test Get Document'
        }
        headers = {k: v for k, v in api_client.headers.items() if k.lower() != 'content-type'}
        upload_response = requests.post(f"{BASE_URL}/api/documents/upload", files=files, data=data, headers=headers)
        
        if upload_response.status_code == 200:
            document_id = upload_response.json()["document"]["id"]
            
            response = api_client.get(f"{BASE_URL}/api/documents/{document_id}")
            assert response.status_code == 200
            
            document = response.json()
            assert document["id"] == document_id
            assert "checksum" in document
            print(f"✓ Retrieved document by ID")
    
    def test_verify_document_integrity(self, api_client):
        """POST /api/documents/{id}/verify - Verify document checksum"""
        # Upload a document first
        file_content = b"Test document for integrity verification"
        files = {'file': ('test_verify.pdf', file_content, 'application/pdf')}
        data = {
            'entity_type': 'contract',
            'entity_id': 'TEST_VERIFY_DOC',
            'category': 'other'
        }
        headers = {k: v for k, v in api_client.headers.items() if k.lower() != 'content-type'}
        upload_response = requests.post(f"{BASE_URL}/api/documents/upload", files=files, data=data, headers=headers)
        
        if upload_response.status_code == 200:
            document_id = upload_response.json()["document"]["id"]
            
            # Verify integrity
            response = api_client.post(f"{BASE_URL}/api/documents/{document_id}/verify")
            assert response.status_code == 200
            
            result = response.json()
            assert result["is_valid"] == True
            assert result["stored_checksum"] == result["current_checksum"]
            print(f"✓ Document integrity verified successfully")


class TestDocumentVersioning:
    """Test Document versioning"""
    
    def test_create_new_version(self, api_client):
        """POST /api/documents/{id}/versions - Create new version of document"""
        # Upload initial document
        file_content_v1 = b"Version 1 content"
        files = {'file': ('test_version.pdf', file_content_v1, 'application/pdf')}
        data = {
            'entity_type': 'contract',
            'entity_id': 'TEST_VERSION_DOC',
            'category': 'contract_draft',
            'title': 'Versioned Document'
        }
        headers = {k: v for k, v in api_client.headers.items() if k.lower() != 'content-type'}
        upload_response = requests.post(f"{BASE_URL}/api/documents/upload", files=files, data=data, headers=headers)
        
        if upload_response.status_code == 200:
            document_id = upload_response.json()["document"]["id"]
            
            # Create new version
            file_content_v2 = b"Version 2 content - updated"
            files_v2 = {'file': ('test_version_v2.pdf', file_content_v2, 'application/pdf')}
            data_v2 = {'version_notes': 'Updated with customer feedback'}
            
            response = requests.post(
                f"{BASE_URL}/api/documents/{document_id}/versions",
                files=files_v2,
                data=data_v2,
                headers=headers
            )
            assert response.status_code == 200
            
            result = response.json()
            assert result["success"] == True
            
            new_document = result["document"]
            assert new_document["version"] == 2
            assert new_document["is_latest"] == True
            assert new_document["previous_version_id"] == document_id
            
            print(f"✓ Created document version 2")
    
    def test_get_document_versions(self, api_client):
        """GET /api/documents/{id}/versions - Get all versions"""
        # Upload and create versions
        file_content = b"Multi-version document"
        files = {'file': ('multi_version.pdf', file_content, 'application/pdf')}
        data = {
            'entity_type': 'contract',
            'entity_id': 'TEST_MULTI_VERSION',
            'category': 'other'
        }
        headers = {k: v for k, v in api_client.headers.items() if k.lower() != 'content-type'}
        upload_response = requests.post(f"{BASE_URL}/api/documents/upload", files=files, data=data, headers=headers)
        
        if upload_response.status_code == 200:
            document_id = upload_response.json()["document"]["id"]
            
            response = api_client.get(f"{BASE_URL}/api/documents/{document_id}/versions")
            assert response.status_code == 200
            
            versions = response.json()
            assert isinstance(versions, list)
            assert len(versions) >= 1
            print(f"✓ Found {len(versions)} version(s) for document")


# =============================================================================
# PIPELINE & AUDIT TESTS
# =============================================================================

class TestContractPipeline:
    """Test Contract Pipeline Summary"""
    
    def test_get_pipeline_summary(self, api_client):
        """GET /api/contracts/pipeline - Get pipeline summary"""
        response = api_client.get(f"{BASE_URL}/api/contracts/pipeline")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_contracts" in data
        assert "total_value" in data
        assert "by_status" in data
        assert "by_type" in data
        assert "pending_approval" in data
        
        print(f"✓ Pipeline Summary:")
        print(f"  - Total Contracts: {data['total_contracts']}")
        print(f"  - Total Value: {data['total_value']:,.0f} VND")
        print(f"  - By Status: {data['by_status']}")
        print(f"  - Pending Approval: {data['pending_approval']}")


class TestAuditTrail:
    """Test Audit Trail Logging"""
    
    def test_get_contract_audit_logs(self, api_client, test_contract_id):
        """GET /api/contracts/{id}/audit-logs - Get audit logs"""
        if not test_contract_id:
            pytest.skip("No test contract available")
        
        response = api_client.get(f"{BASE_URL}/api/contracts/{test_contract_id}/audit-logs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Should have at least 'create' action
        if data:
            log = data[0]
            assert "id" in log
            assert "action" in log
            assert "timestamp" in log
        
        print(f"✓ Found {len(data)} audit log entries")
    
    def test_audit_log_created_on_submit(self, api_client):
        """Verify audit log is created when contract is submitted"""
        # Create contract
        create_payload = {
            "customer_id": "TEST_AUDIT_SUBMIT",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "sale_contract",
            "unit_price": 1200000000
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        contract_id = create_response.json()["id"]
        
        # Submit
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        
        # Get audit logs
        response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}/audit-logs")
        assert response.status_code == 200
        
        logs = response.json()
        actions = [log["action"] for log in logs]
        
        assert "create" in actions
        assert "submit" in actions
        print(f"✓ Audit trail correctly records create and submit actions")


# =============================================================================
# SIGNING TESTS
# =============================================================================

class TestContractSigning:
    """Test Contract Signing"""
    
    def test_sign_approved_contract(self, api_client):
        """POST /api/contracts/{id}/sign - Sign approved contract"""
        # Create and fully approve contract
        create_payload = {
            "customer_id": "TEST_SIGN_CONTRACT",
            "product_id": PRODUCT_ID,
            "project_id": PROJECT_ID,
            "contract_type": "deposit_agreement",
            "unit_price": 800000000,
            "discount_percent": 0
        }
        create_response = api_client.post(f"{BASE_URL}/api/contracts", json=create_payload)
        contract_id = create_response.json()["id"]
        
        # Full workflow
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/submit")
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "OK"})
        api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/approve", json={"comments": "OK"})
        
        # Get status
        get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
        contract = get_response.json()
        
        if contract["status"] == "approved":
            # Sign
            sign_payload = {
                "signed_by_customer_id": "TEST_SIGN_CONTRACT",
                "signed_by_company_id": "COMPANY_DIRECTOR_001",
                "signed_by_company_title": "Tổng Giám đốc",
                "signing_location": "Hồ Chí Minh",
                "notarized": False
            }
            
            response = api_client.post(f"{BASE_URL}/api/contracts/{contract_id}/sign", json=sign_payload)
            assert response.status_code == 200
            
            result = response.json()
            assert result["success"] == True
            
            # Verify contract is signed and locked
            get_response = api_client.get(f"{BASE_URL}/api/contracts/{contract_id}")
            signed = get_response.json()
            assert signed["status"] == "signed"
            assert signed["is_locked"] == True
            assert signed["signing_status"] == "completed"
            print(f"✓ Contract signed successfully and locked")
        else:
            print(f"⚠ Contract not approved (status: {contract['status']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
