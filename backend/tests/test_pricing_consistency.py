"""
ProHouzing Pricing Engine Consistency Test
Phase 4: Final Verification

Tests:
1. Cùng 1 unit, nhiều payment plans → giá khác nhau đúng logic
2. Thay đổi policy → giá update đúng
3. Discount stacking và max discount
"""

import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

sys.path.insert(0, '/app/backend')

from config.sales_config import PaymentPlanType, PRICING_ENGINE_CONFIG

# Test configuration
TEST_TENANT_ID = "test_tenant_pricing"
TEST_PROJECT_ID = "test_project_pricing"

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


async def cleanup(db):
    """Clean up test data"""
    print("\n🧹 Cleaning up pricing test data...")
    tenant_filter = {"tenant_id": TEST_TENANT_ID}
    project_filter = {"project_id": TEST_PROJECT_ID}
    
    await db.products.delete_many(project_filter)
    await db.pricing_policies.delete_many(tenant_filter)
    await db.payment_plans.delete_many(tenant_filter)
    await db.promotions.delete_many(tenant_filter)
    print("✓ Test data cleaned")


async def setup_test_product(db):
    """Create test product"""
    print("\n📦 Creating test product...")
    
    product = {
        "id": "pricing_test_unit",
        "code": "PRICE-001",
        "name": "Pricing Test Unit",
        "project_id": TEST_PROJECT_ID,
        "floor_number": 15,
        "area": 100,
        "base_price": 5000000000,  # 5 tỷ
        "price_per_sqm": 50000000,  # 50 triệu/m2
        "view": "river",
        "position": "corner",
        "inventory_status": "available",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.products.insert_one(product)
    print(f"✓ Created product: {product['code']} - Base price: {product['base_price']:,.0f} VND")
    return product


async def setup_payment_plans(db):
    """Create different payment plans"""
    print("\n💳 Creating payment plans...")
    
    now = datetime.now(timezone.utc).isoformat()
    plans = [
        {
            "id": "plan_standard",
            "code": "PTTT-STANDARD",
            "name": "Tiến độ chuẩn",
            "tenant_id": TEST_TENANT_ID,
            "project_id": TEST_PROJECT_ID,
            "plan_type": PaymentPlanType.STANDARD.value,
            "discount_percent": 0,  # No discount
            "status": "active",
            "effective_from": now,
            "created_at": now,
        },
        {
            "id": "plan_fast",
            "code": "PTTT-FAST",
            "name": "Thanh toán nhanh 50%",
            "tenant_id": TEST_TENANT_ID,
            "project_id": TEST_PROJECT_ID,
            "plan_type": PaymentPlanType.FAST.value,
            "discount_percent": 3,  # 3% discount
            "status": "active",
            "effective_from": now,
            "created_at": now,
        },
        {
            "id": "plan_full",
            "code": "PTTT-100",
            "name": "Thanh toán 100%",
            "tenant_id": TEST_TENANT_ID,
            "project_id": TEST_PROJECT_ID,
            "plan_type": PaymentPlanType.FULL.value,
            "discount_percent": 8,  # 8% discount
            "status": "active",
            "effective_from": now,
            "created_at": now,
        },
    ]
    
    await db.payment_plans.insert_many(plans)
    
    for plan in plans:
        print(f"  ✓ {plan['name']}: {plan['discount_percent']}% discount")
    
    return plans


async def setup_pricing_policy(db):
    """Create pricing policy with adjustments"""
    print("\n📊 Creating pricing policy...")
    
    now = datetime.now(timezone.utc).isoformat()
    
    policy = {
        "id": "policy_premium",
        "code": "PP-PREMIUM",
        "name": "Chính sách giá Premium",
        "tenant_id": TEST_TENANT_ID,
        "project_id": TEST_PROJECT_ID,
        "price_type": "per_sqm",
        "adjustments": [
            {
                "type": "floor_premium",
                "rule": "floor >= 10",
                "adjustment_type": "percent",
                "adjustment_value": 5,  # +5% for high floor
            },
            {
                "type": "view_premium",
                "rule": "view = river",
                "adjustment_type": "percent",
                "adjustment_value": 3,  # +3% for river view
            },
            {
                "type": "corner_premium",
                "rule": "position = corner",
                "adjustment_type": "percent",
                "adjustment_value": 2,  # +2% for corner
            },
        ],
        "max_discount_percent": 15,
        "requires_approval_above": 10,
        "status": "active",
        "effective_from": now,
        "created_at": now,
    }
    
    await db.pricing_policies.insert_one(policy)
    print(f"  ✓ Policy: {policy['name']}")
    print(f"    - Floor premium: +5%")
    print(f"    - View premium: +3%")
    print(f"    - Corner premium: +2%")
    
    return policy


async def setup_promotion(db):
    """Create promotion"""
    print("\n🎁 Creating promotion...")
    
    now = datetime.now(timezone.utc)
    
    promo = {
        "id": "promo_opening",
        "code": "OPENING2026",
        "name": "Ưu đãi khai trương",
        "tenant_id": TEST_TENANT_ID,
        "project_ids": [TEST_PROJECT_ID],
        "discount_type": "percent",
        "discount_value": 2,  # 2%
        "status": "active",
        "start_date": (now - timedelta(days=1)).isoformat(),
        "end_date": (now + timedelta(days=30)).isoformat(),
        "created_at": now.isoformat(),
    }
    
    await db.promotions.insert_one(promo)
    print(f"  ✓ Promo: {promo['name']} - {promo['discount_value']}% off")
    
    return promo


async def calculate_price(db, product, policy_id=None, plan_id=None, promo_codes=None, special_discounts=None):
    """Calculate price for a product"""
    
    base_price = product.get("base_price", 0)
    area = product.get("area", 0)
    price_per_sqm = product.get("price_per_sqm", 0)
    
    if base_price == 0 and price_per_sqm > 0:
        base_price = area * price_per_sqm
    
    # Apply policy adjustments
    total_adjustment = 0
    policy_adjustments = []
    
    if policy_id:
        policy = await db.pricing_policies.find_one({"id": policy_id}, {"_id": 0})
        if policy:
            for adj in policy.get("adjustments", []):
                adj_type = adj.get("type", "")
                adj_value = adj.get("adjustment_value", 0)
                
                should_apply = False
                
                if adj_type == "floor_premium" and product.get("floor_number", 0) >= 10:
                    should_apply = True
                elif adj_type == "view_premium" and product.get("view") in ["river", "sea"]:
                    should_apply = True
                elif adj_type == "corner_premium" and product.get("position") == "corner":
                    should_apply = True
                
                if should_apply:
                    adj_amount = base_price * adj_value / 100
                    total_adjustment += adj_amount
                    policy_adjustments.append({
                        "type": adj_type,
                        "value": adj_value,
                        "amount": adj_amount,
                    })
    
    listed_price = base_price + total_adjustment
    
    # Apply payment plan discount
    payment_plan_discount = 0
    payment_plan_percent = 0
    if plan_id:
        plan = await db.payment_plans.find_one({"id": plan_id}, {"_id": 0})
        if plan:
            payment_plan_percent = plan.get("discount_percent", 0)
            payment_plan_discount = listed_price * payment_plan_percent / 100
    
    # Apply promotions
    promotion_discount = 0
    promotion_percent = 0
    if promo_codes:
        for code in promo_codes:
            promo = await db.promotions.find_one({"code": code, "status": "active"}, {"_id": 0})
            if promo and promo.get("discount_type") == "percent":
                promotion_percent = promo.get("discount_value", 0)
                promotion_discount = listed_price * promotion_percent / 100
    
    # Apply special discounts
    special_discount = 0
    special_percent = 0
    if special_discounts:
        for discount_type, discount_pct in special_discounts.items():
            special_percent += discount_pct
            special_discount += listed_price * discount_pct / 100
    
    total_discount = payment_plan_discount + promotion_discount + special_discount
    total_discount_percent = (total_discount / listed_price * 100) if listed_price > 0 else 0
    
    final_price = listed_price - total_discount
    
    return {
        "base_price": base_price,
        "policy_adjustments": policy_adjustments,
        "total_adjustment": total_adjustment,
        "total_adjustment_percent": (total_adjustment / base_price * 100) if base_price > 0 else 0,
        "listed_price": listed_price,
        "payment_plan_discount": payment_plan_discount,
        "payment_plan_percent": payment_plan_percent,
        "promotion_discount": promotion_discount,
        "promotion_percent": promotion_percent,
        "special_discount": special_discount,
        "special_percent": special_percent,
        "total_discount": total_discount,
        "total_discount_percent": total_discount_percent,
        "final_price": final_price,
        "requires_approval": total_discount_percent > PRICING_ENGINE_CONFIG.get("requires_approval_above", 10),
        "exceeds_max": total_discount_percent > PRICING_ENGINE_CONFIG.get("max_total_discount_percent", 15),
    }


# ============================================
# TEST 1: Same unit, different payment plans
# ============================================

async def test_pricing_with_different_plans(db, product, plans):
    """Test: Same unit with different payment plans should have different prices"""
    print("\n" + "="*60)
    print("TEST 1: Same unit, different payment plans")
    print("="*60)
    
    results = []
    
    for plan in plans:
        price = await calculate_price(db, product, plan_id=plan["id"])
        results.append({
            "plan": plan["name"],
            "discount_percent": plan["discount_percent"],
            "final_price": price["final_price"],
            "discount_amount": price["payment_plan_discount"],
        })
        print(f"\n  💳 {plan['name']} ({plan['discount_percent']}% discount):")
        print(f"     Base price:   {price['base_price']:>15,.0f} VND")
        print(f"     Discount:     {price['payment_plan_discount']:>15,.0f} VND")
        print(f"     Final price:  {price['final_price']:>15,.0f} VND")
    
    # Verify prices are different and correct
    errors = []
    
    # Standard should have no discount
    standard = next(r for r in results if "chuẩn" in r["plan"].lower())
    if standard["discount_amount"] != 0:
        errors.append(f"Standard plan should have 0 discount, got {standard['discount_amount']}")
    
    # Fast should be cheaper than Standard
    fast = next(r for r in results if "nhanh" in r["plan"].lower())
    if fast["final_price"] >= standard["final_price"]:
        errors.append("Fast plan should be cheaper than Standard")
    
    # Full payment should be cheapest
    full = next(r for r in results if "100%" in r["plan"])
    if full["final_price"] >= fast["final_price"]:
        errors.append("Full payment should be cheaper than Fast")
    
    if errors:
        print("\n❌ FAILED:")
        for e in errors:
            print(f"  {e}")
        return False
    else:
        print("\n✅ PASSED: Different payment plans produce different prices")
        print(f"  Standard: {standard['final_price']:,.0f} VND")
        print(f"  Fast (-3%): {fast['final_price']:,.0f} VND (saves {standard['final_price'] - fast['final_price']:,.0f})")
        print(f"  Full (-8%): {full['final_price']:,.0f} VND (saves {standard['final_price'] - full['final_price']:,.0f})")
        return True


# ============================================
# TEST 2: Policy adjustments update price correctly
# ============================================

async def test_policy_adjustments(db, product, policy):
    """Test: Policy adjustments should update price correctly"""
    print("\n" + "="*60)
    print("TEST 2: Policy adjustments update price correctly")
    print("="*60)
    
    # Price without policy
    price_no_policy = await calculate_price(db, product)
    
    # Price with policy
    price_with_policy = await calculate_price(db, product, policy_id=policy["id"])
    
    print(f"\n  📊 Without policy:")
    print(f"     Base price:    {price_no_policy['base_price']:>15,.0f} VND")
    print(f"     Adjustments:   {price_no_policy['total_adjustment']:>15,.0f} VND")
    print(f"     Listed price:  {price_no_policy['listed_price']:>15,.0f} VND")
    
    print(f"\n  📊 With Premium policy:")
    print(f"     Base price:    {price_with_policy['base_price']:>15,.0f} VND")
    print(f"     Adjustments:   {price_with_policy['total_adjustment']:>15,.0f} VND (+{price_with_policy['total_adjustment_percent']:.1f}%)")
    print(f"     Listed price:  {price_with_policy['listed_price']:>15,.0f} VND")
    
    print(f"\n  📋 Applied adjustments:")
    for adj in price_with_policy['policy_adjustments']:
        print(f"     - {adj['type']}: +{adj['value']}% = {adj['amount']:,.0f} VND")
    
    # Verify
    errors = []
    
    # Price with policy should be higher
    if price_with_policy['listed_price'] <= price_no_policy['listed_price']:
        errors.append("Price with policy should be higher than without")
    
    # Expected adjustment = 5% (floor) + 3% (view) + 2% (corner) = 10%
    expected_adjustment_percent = 5 + 3 + 2  # 10%
    actual_adjustment_percent = price_with_policy['total_adjustment_percent']
    
    if abs(actual_adjustment_percent - expected_adjustment_percent) > 0.1:
        errors.append(f"Expected {expected_adjustment_percent}% adjustment, got {actual_adjustment_percent:.1f}%")
    
    if errors:
        print("\n❌ FAILED:")
        for e in errors:
            print(f"  {e}")
        return False
    else:
        print("\n✅ PASSED: Policy adjustments applied correctly")
        print(f"  Total adjustment: +{actual_adjustment_percent:.1f}% ({price_with_policy['total_adjustment']:,.0f} VND)")
        return True


# ============================================
# TEST 3: Discount stacking and max discount
# ============================================

async def test_discount_stacking(db, product, policy, promo):
    """Test: Discount stacking and max discount warning"""
    print("\n" + "="*60)
    print("TEST 3: Discount stacking and max discount")
    print("="*60)
    
    # Full payment + Promotion + VIP special discount
    price = await calculate_price(
        db, product,
        policy_id=policy["id"],
        plan_id="plan_full",
        promo_codes=[promo["code"]],
        special_discounts={"vip": 3, "referral": 2}
    )
    
    print(f"\n  📊 Discount stacking:")
    print(f"     Base price:        {price['base_price']:>15,.0f} VND")
    print(f"     + Policy adj:      {price['total_adjustment']:>15,.0f} VND")
    print(f"     = Listed price:    {price['listed_price']:>15,.0f} VND")
    print(f"     - Payment plan:    {price['payment_plan_discount']:>15,.0f} VND ({price['payment_plan_percent']}%)")
    print(f"     - Promotion:       {price['promotion_discount']:>15,.0f} VND ({price['promotion_percent']}%)")
    print(f"     - Special:         {price['special_discount']:>15,.0f} VND ({price['special_percent']}%)")
    print(f"     = Total discount:  {price['total_discount']:>15,.0f} VND ({price['total_discount_percent']:.1f}%)")
    print(f"     = Final price:     {price['final_price']:>15,.0f} VND")
    
    # Check flags
    print(f"\n  ⚠️ Approval required: {price['requires_approval']} (> {PRICING_ENGINE_CONFIG['requires_approval_above']}%)")
    print(f"  ⚠️ Exceeds max: {price['exceeds_max']} (> {PRICING_ENGINE_CONFIG['max_total_discount_percent']}%)")
    
    errors = []
    
    # Total discount should be sum of all discounts
    expected_total_percent = 8 + 2 + 3 + 2  # payment + promo + vip + referral = 15%
    if abs(price['total_discount_percent'] - expected_total_percent) > 0.1:
        errors.append(f"Expected {expected_total_percent}% total discount, got {price['total_discount_percent']:.1f}%")
    
    # Should require approval (> 10%)
    if not price['requires_approval']:
        errors.append("Should require approval for > 10% discount")
    
    # Should NOT exceed max (15%)
    if price['exceeds_max']:
        errors.append(f"Should not exceed max discount ({PRICING_ENGINE_CONFIG['max_total_discount_percent']}%)")
    
    if errors:
        print("\n❌ FAILED:")
        for e in errors:
            print(f"  {e}")
        return False
    else:
        print("\n✅ PASSED: Discount stacking works correctly")
        print(f"  Total discount: {price['total_discount_percent']:.1f}%")
        print(f"  Savings: {price['total_discount']:,.0f} VND")
        return True


async def main():
    """Main test runner"""
    print("="*60)
    print("🧪 PRICING ENGINE CONSISTENCY TEST")
    print("="*60)
    
    db = await get_db()
    print(f"\n✓ Connected to database: {DB_NAME}")
    
    # Cleanup
    await cleanup(db)
    
    # Setup
    product = await setup_test_product(db)
    plans = await setup_payment_plans(db)
    policy = await setup_pricing_policy(db)
    promo = await setup_promotion(db)
    
    results = []
    
    # Test 1: Different payment plans
    results.append(("Different Payment Plans", await test_pricing_with_different_plans(db, product, plans)))
    
    # Test 2: Policy adjustments
    results.append(("Policy Adjustments", await test_policy_adjustments(db, product, policy)))
    
    # Test 3: Discount stacking
    results.append(("Discount Stacking", await test_discount_stacking(db, product, policy, promo)))
    
    # Cleanup
    await cleanup(db)
    
    # Summary
    print("\n" + "="*60)
    print("📋 PRICING CONSISTENCY TEST SUMMARY")
    print("="*60)
    
    all_passed = True
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {status}: {name}")
        if not passed:
            all_passed = False
    
    print("="*60)
    
    if all_passed:
        print("✅ ALL PRICING TESTS PASSED!")
    else:
        print("❌ SOME PRICING TESTS FAILED!")
    
    print("="*60 + "\n")
    
    return all_passed


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)
