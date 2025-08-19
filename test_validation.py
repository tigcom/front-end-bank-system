#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def test_amount_validation():
    """Test validation logic cho amount theo currency"""
    
    currency_options = [
        {'currencyCode': 'VND', 'minAmount': 1000, 'maxAmount': 1000000000},
        {'currencyCode': 'USD', 'minAmount': 1, 'maxAmount': 1000000},
        {'currencyCode': 'EUR', 'minAmount': 1, 'maxAmount': 1000000},
    ]
    
    def amount_validator(amount, currency):
        if not amount or not currency:
            return None
            
        currency_option = next((opt for opt in currency_options if opt['currencyCode'] == currency), None)
        if not currency_option:
            return None
            
        if amount < currency_option['minAmount']:
            return f"minAmount: Số tiền tối thiểu cho {currency} là {currency_option['minAmount']:,} {currency}"
            
        if amount > currency_option['maxAmount']:
            return f"maxAmount: Số tiền tối đa cho {currency} là {currency_option['maxAmount']:,} {currency}"
            
        if currency == 'VND':
            if amount % 1000 != 0:
                return "invalidVNDAmount: Số tiền VND phải là bội số của 1,000"
            decimal_places = len(str(amount).split('.')[1]) if '.' in str(amount) else 0
            if decimal_places > 0:
                return "invalidVNDAmount: Số tiền VND không được có phần thập phân"
                
        if currency in ['USD', 'EUR']:
            decimal_places = len(str(amount).split('.')[1]) if '.' in str(amount) else 0
            if decimal_places > 2:
                return f"invalidDecimalAmount: Số tiền {currency} chỉ được có tối đa 2 chữ số thập phân"
                
        return None
    
    # Test cases
    test_cases = [
        # VND tests
        (500, 'VND', 'minAmount'),  # Dưới minimum
        (1500, 'VND', None),  # Hợp lệ
        (1500.5, 'VND', 'invalidVNDAmount'),  # Có decimal
        (1501, 'VND', 'invalidVNDAmount'),  # Không chia hết cho 1000
        
        # USD tests
        (0.5, 'USD', 'minAmount'),  # Dưới minimum
        (1.5, 'USD', None),  # Hợp lệ
        (1.555, 'USD', 'invalidDecimalAmount'),  # Quá 2 decimal places
        (1000001, 'USD', 'maxAmount'),  # Vượt maximum
        
        # EUR tests
        (0.99, 'EUR', 'minAmount'),  # Dưới minimum
        (1.25, 'EUR', None),  # Hợp lệ
        (1.256, 'EUR', 'invalidDecimalAmount'),  # Quá 2 decimal places
    ]
    
    print("=== TEST VALIDATION LOGIC ===")
    for amount, currency, expected_error in test_cases:
        result = amount_validator(amount, currency)
        error_type = result.split(':')[0] if result else None
        status = "✅ PASS" if error_type == expected_error else "❌ FAIL"
        print(f"{status} | Amount: {amount} {currency} | Expected: {expected_error} | Got: {error_type}")
        if result:
            print(f"   Message: {result}")

if __name__ == "__main__":
    test_amount_validation() 