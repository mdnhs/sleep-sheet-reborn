# 06-PRODUCTS.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Products Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Products, categories, brands, units, variants, attributes, and images carry `organization_id`.
- **SKU, barcode, and slug are unique per organization, not globally** — two organizations may use the same SKU/slug.
- Product creation counts against the organization's plan product limit (server-side).
- All catalog queries are auto-scoped to the resolved tenant.

---

# 1. Purpose

The Products module serves as the product catalog engine.

It manages:

- Products
- Categories
- Brands
- Variants
- Attributes
- Units
- Product Images
- SEO Data

The Products module does not manage stock.

Inventory remains responsible for stock management.

---

# 2. Product Philosophy

Products represent sellable catalog items.

Products define:

- What can be sold
- How products are organized
- How products appear online

Products do not define inventory.

---

# 3. Product Architecture

```text
Categories
    │
Brands
    │
Products
    │
Variants
    │
Inventory
```

---

# 4. Core Entities

## Categories

Product grouping.

Examples:

- Grocery
- Electronics
- Cosmetics
- Home & Living

---

## Brands

Product manufacturers.

Examples:

- Nestlé
- Pran
- Samsung

---

## Products

Master product record.

Contains:

- Name
- SKU
- Category
- Brand
- Description

---

## Variants

Sellable product variations.

Examples:

Rice

- 1kg
- 5kg
- 25kg

Inventory tracked per variant.

---

## Attributes

Variant-defining properties.

Examples:

- Size
- Color
- Weight
- Volume

---

## Units

Measurement units.

Examples:

- PCS
- KG
- Gram
- Liter
- Bottle
- Packet

---

# 5. Product Lifecycle

```text
Draft
  ↓
Active
  ↓
Archived
```

---

## Draft

Not visible.

Cannot be sold.

---

## Active

Visible and sellable.

---

## Archived

Hidden from sales and ecommerce.

Historical data remains available.

---

# 6. Categories

Purpose:

Organize products.

---

## Hierarchy

```text
Category
   ↓
Sub Category
```

---

## Example

```text
Grocery
   ↓
Rice
```

---

## Rules

Categories cannot be deleted if products exist.

---

# 7. Brands

Purpose:

Identify manufacturer.

---

## Rules

Brand deletion prohibited if linked products exist.

Archive instead.

---

# 8. Product Variants

Purpose:

Represent sellable variations.

---

## Example

```text
Rice

Variant A
1kg

Variant B
5kg

Variant C
25kg
```

---

## Rules

Inventory tracked at variant level.

Not parent product level.

---

# 9. SKU Management

Every variant must have a unique SKU.

---

## Example

```text
RICE-001-1KG

RICE-001-5KG
```

---

## Rules

SKU duplication prohibited.

---

# 10. Barcode Management

Every variant may have:

- Barcode
- SKU

---

## Uses

- POS
- Inventory
- Receiving
- Transfers

---

## Rules

Barcode must be unique.

---

# 11. Product Images

Purpose:

Product presentation.

---

## Storage

Cloudinary

---

## Supported Images

- Main Image
- Gallery Images

---

## Rules

Database stores URLs only.

---

# 12. Product Attributes

Purpose:

Generate variants.

---

## Examples

Color:

```text
Red
Blue
Black
```

---

Size:

```text
S
M
L
XL
```

---

# 13. Pricing

Each variant has pricing.

---

## Fields

- Cost Price
- Selling Price

---

## Rules

Selling price cannot be negative.

---

# 14. Cost Price

Used for:

- Profit Calculation
- Inventory Valuation

---

## Rules

Not visible to customers.

---

# 15. Selling Price

Used by:

- Ecommerce
- POS

---

## Rules

Active products require selling price.

---

# 16. Product Status

Supported statuses:

```text
Draft

Active

Inactive

Archived
```

---

## Inactive

Hidden from selling.

Historical records remain.

---

# 17. Product Visibility

Visibility Types:

```text
Public

Hidden
```

---

## Public

Visible on website.

---

## Hidden

Internal use only.

---

# 18. SEO Management

Products support:

- SEO Title
- SEO Description
- SEO Keywords
- URL Slug

---

## Rules

Slug must be unique.

---

# 19. Product Reviews

Customers can submit reviews.

---

## Review Data

- Rating
- Comment
- Customer

---

## Rules

Reviews cannot affect product inventory.

---

# 20. Product Questions

Customers may submit questions.

---

## Workflow

```text
Question
    ↓
Answer
```

---

# 21. Product Tags

Purpose:

Search and filtering.

---

## Examples

```text
Popular

Organic

Imported
```

---

# 22. Product Import

Purpose:

Bulk product creation.

---

## Supported Formats

- CSV
- XLSX

---

## Import Validation

- SKU uniqueness
- Category existence
- Brand existence

---

# 23. Product Export

Purpose:

Bulk data export.

---

## Supported Formats

- CSV
- XLSX

---

# 24. Product Search

Searchable By:

- Product Name
- SKU
- Barcode
- Category
- Brand

---

# 25. Product Relationships

Product linked with:

- Inventory
- Orders
- POS
- Purchases

---

## Rules

Products cannot be hard deleted.

---

# 26. Product Archiving

Purpose:

Retire products safely.

---

## Actions

- Remove from sales
- Remove from ecommerce

---

## Rules

Historical records preserved.

---

# 27. Inventory Integration

Products do not store stock.

---

## Incorrect

```text
products.stock
```

---

## Correct

```text
inventory.quantity
```

---

# 28. Purchase Integration

Products may be purchased from suppliers.

---

## Rules

Purchases reference variants.

Not parent products.

---

# 29. POS Integration

POS sells variants.

---

## Example

```text
Rice 5kg
```

Not:

```text
Rice
```

---

# 30. Ecommerce Integration

Website displays:

- Product Details
- Variants
- Availability
- Images

---

## Rules

Availability comes from Inventory Module.

---

# 31. Inventory Availability

Availability Formula:

```text
Available Stock

=

Physical Stock

-

Reserved Stock
```

Products module must never calculate stock independently.

---

# 32. Product Reports

Supported Reports:

- Product Performance
- Best Sellers
- Slow Movers
- Product Profitability
- Category Performance
- Brand Performance

---

# 33. Permissions

Required permissions:

```text
products.view

products.create

products.update

products.archive

products.import

products.export
```

---

# 34. Audit Logging

Mandatory For:

- Product Creation
- Product Update
- Product Archive
- Price Changes
- Import Operations

---

# 35. API Responsibilities

Product APIs must:

- Validate SKU uniqueness
- Validate slug uniqueness
- Validate category existence
- Validate brand existence

---

## Product APIs Must Never

❌ Store stock

❌ Modify inventory

❌ Calculate inventory

❌ Bypass services

---

# 36. Common Mistakes To Avoid

❌ Storing stock in products table

❌ Tracking inventory at parent product level

❌ Duplicate SKU

❌ Duplicate barcode

❌ Hard deleting products

❌ Hard deleting categories

❌ Hard deleting brands

---

# 37. Golden Rules

Rule A

Products do not store stock.

---

Rule B

Inventory belongs to Inventory Module.

---

Rule C

Variants are sellable units.

---

Rule D

Inventory is tracked per variant.

---

Rule E

Every variant must have a unique SKU.

---

Rule F

Barcodes must be unique.

---

Rule G

Products should be archived, not deleted.

---

Rule H

Categories and Brands are organizational data.

---

Rule I

Availability comes from Inventory Module.

---

Rule J

Products define what is sold, not how much stock exists.

---

Rule K

Catalog is organization-scoped; SKU/barcode/slug are unique per organization.
