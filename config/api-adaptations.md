# API Adaptations Log

Track all adaptations made to handle real API responses that differ from documentation.

## Purpose
- Document discrepancies between expected and actual API responses
- Track workarounds and solutions
- Help future developers understand why code looks the way it does
- Create institutional knowledge about your specific API configurations

---

## Shopify Adaptations

### (Template - Fill in as you discover issues)

**Date:** YYYY-MM-DD
**Issue:** Brief description of the problem
**Impact:** What broke or didn't work
**Solution:** How you fixed it
**File:** Path to modified file
**TODO:** Any follow-up needed

---

### Example Entry:

**Date:** 2024-01-15
**Issue:** `compare_at_price` field is null for all products
**Impact:** Cannot calculate actual product costs and margins
**Solution:** Using fallback calculation with 40% assumed margin (configurable in thresholds.json)
**File:** `src/integrations/shopify/client.js:78`
**TODO:** Import actual costs from Sage accounting system once integrated

---

## Orderwise Adaptations

### (Add your discoveries here)

---

## Klaviyo Adaptations

### (Add your discoveries here)

---

## Aptean SI Adaptations

### (Add your discoveries here)

---

## General Patterns Discovered

### Common Issues Across Systems
- Date format inconsistencies
- Null handling
- Field naming conventions
- Data type mismatches

### Best Practices Developed
- Always use safe parsing functions
- Check multiple possible field names
- Validate data before processing
- Log warnings for unexpected structures

---

## Maintenance Notes

**Last Updated:** [Date]
**Updated By:** [Name]

**Review Schedule:**
- Monthly review of adaptations
- Update documentation when API changes
- Remove obsolete workarounds when APIs are fixed
