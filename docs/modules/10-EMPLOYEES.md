# 10-EMPLOYEES.md

# Multi-Tenant Retail ERP + POS + E-Commerce SaaS

Employees Module Documentation

Version: 2.0

> Org-scoped. Aligned with `SRS.md` (v2.0), `RBAC.md` / `BUSINESS_RULES.md` / `DATABASE_SCHEMA.md` (v2.0).

---

# 0. Multi-Tenancy

- Employees, departments, attendance, and payroll carry `organization_id`.
- `employee_code` is unique **per organization**.
- Employees belong to an organization via `organization_users`; their org role (OWNER…EMPLOYEE) is assigned there.
- Creating/inviting an employee-user counts against the organization's plan **user limit** (server-side).
- Org roles are organization-scoped; the platform `SUPER_ADMIN` role is separate (see `RBAC.md`).

---

# 1. Purpose

The Employees module manages workforce operations.

It integrates with:

- RBAC
- POS
- Finance
- Attendance
- Payroll
- Audit Logs

Employees are system users who perform business operations.

---

# 2. Employee Philosophy

Employees perform actions.

Roles define permissions.

Permissions define access.

Never assign business permissions directly to employees.

Always assign roles.

---

# 3. Employee Architecture

```text
Employee
    │
    ├── User Account
    │
    ├── Role
    │
    ├── Attendance
    │
    ├── Leave
    │
    ├── Payroll
    │
    └── Audit Logs
```

---

# 4. Employee Types

Supported employee types:

```text
Admin

Manager

Cashier

Sales Executive

Warehouse Staff

Delivery Staff

Accountant
```

---

# 5. Employee Profile

Core Information:

- Employee ID
- Full Name
- Phone
- Email
- Address
- Joining Date
- Department
- Designation

---

## Optional

- NID Number
- Emergency Contact
- Profile Photo

---

# 6. Employee Lifecycle

```text
Created
   ↓
Active
   ↓
Suspended
   ↓
Inactive
   ↓
Archived
```

---

## Archived

Employee cannot:

- Login
- Perform actions
- Access modules

Historical records remain available.

---

# 7. Departments

Purpose:

Organize employees.

---

## Examples

```text
Administration

Sales

Inventory

Purchases

Finance

Delivery
```

---

## Rules

Department deletion prohibited if employees exist.

---

# 8. Designations

Purpose:

Define employee position.

---

## Examples

```text
Store Manager

Cashier

Warehouse Officer

Accountant
```

---

# 9. User Accounts

Every employee may have:

```text
One Employee
      ↓
One User Account
```

---

## Rules

Employee account and user account are linked.

---

# 10. Authentication

Authentication handled by:

- Better Auth

---

## Supports

- Email Login
- Password Login
- Session Management

---

# 11. RBAC Integration

Employees access modules through roles.

---

## Flow

```text
Employee
     ↓
Role
     ↓
Permissions
```

---

## Example

Cashier:

```text
pos.view

pos.sale

customers.view
```

---

# 12. Attendance

Purpose:

Track employee attendance.

---

## Statuses

```text
Present

Absent

Late

Half Day

Leave
```

---

# 13. Attendance Workflow

```text
Clock In
     ↓
Working Hours
     ↓
Clock Out
```

---

## Actions

- Record check-in
- Record check-out
- Calculate working hours

---

# 14. Shift Management

Purpose:

Manage employee shifts.

---

## Shift Types

```text
Morning

Evening

Night
```

---

## Future

Custom shifts.

---

# 15. Leave Management

Purpose:

Manage employee leave requests.

---

## Workflow

```text
Request
   ↓
Review
   ↓
Approve
```

---

## Leave Types

- Casual Leave
- Sick Leave
- Annual Leave
- Unpaid Leave

---

# 16. Leave Rules

Approved leave affects attendance.

---

## Example

Approved Leave:

Attendance Status:

```text
Leave
```

---

# 17. Payroll

Purpose:

Manage employee compensation.

---

## Components

- Basic Salary
- Allowances
- Bonuses
- Deductions

---

# 18. Payroll Formula

```text
Basic Salary

+ Allowances

+ Bonus

- Deductions

= Net Salary
```

---

# 19. Payroll Workflow

```text
Attendance
      ↓
Salary Calculation
      ↓
Approval
      ↓
Payment
```

---

## Rules

Payroll records are immutable after approval.

---

# 20. Salary Payments

Supported methods:

- Cash
- Bank Transfer
- Mobile Banking

---

## Actions

- Create payroll record
- Create financial transaction

---

# 21. Employee Performance

Purpose:

Track employee performance.

---

## Metrics

Cashier:

- Total Sales
- Transactions

Warehouse Staff:

- Receiving Activity
- Transfer Activity

Delivery Staff:

- Deliveries Completed

---

# 22. Employee Documents

Supported:

- NID
- Appointment Letter
- Contract
- Certificates

---

## Storage

Cloudinary

---

## Rules

Only URLs stored in database.

---

# 23. Employee Notes

Internal HR notes.

---

## Examples

```text
Promotion Candidate

Performance Concern
```

---

## Rules

Only HR/Admin can access.

---

# 24. Employee Statuses

Supported:

```text
Active

Suspended

Inactive

Archived
```

---

## Suspended

Employee cannot:

- Login
- Access system
- Perform actions

---

# 25. Employee Search

Searchable By:

- Name
- Phone
- Email
- Employee ID

---

# 26. Employee Reports

Supported Reports:

- Employee List
- Attendance Report
- Leave Report
- Payroll Report
- Performance Report

---

# 27. Attendance Reports

Metrics:

- Present Days
- Late Days
- Leave Days
- Working Hours

---

# 28. Payroll Reports

Metrics:

- Salary Paid
- Pending Salary
- Department Salary Cost

---

# 29. Department Reports

Metrics:

- Employee Count
- Salary Cost
- Attendance Summary

---

# 30. Finance Integration

Payroll creates:

- Expense Records
- Financial Transactions

---

## Rules

Payroll expenses must be auditable.

---

# 31. POS Integration

Cashiers linked with:

- POS Sales
- Register Sessions

---

## Reports

Cashier performance report supported.

---

# 32. Audit Logging

Mandatory For:

- Employee Creation
- Employee Update
- Role Assignment
- Payroll Approval
- Employee Suspension

---

# 33. Permissions

Required permissions:

```text
employees.view

employees.create

employees.update

employees.attendance

employees.leave

employees.payroll
```

---

# 34. API Responsibilities

Employee APIs must:

- Validate employee data
- Assign roles
- Generate audit logs
- Update attendance records

---

## Employee APIs Must Never

❌ Directly assign permissions

❌ Delete payroll history

❌ Delete attendance history

❌ Bypass RBAC

---

# 35. Common Mistakes To Avoid

❌ Assigning permissions directly to employees

❌ Deleting attendance records

❌ Deleting payroll records

❌ Allowing suspended users to login

❌ Storing documents in database

---

# 36. Future Enhancements

Future support:

- Biometric Attendance
- Face Recognition
- Employee Mobile App
- Performance Reviews
- Recruitment Management

Not included in V1.

---

# 37. Golden Rules

Rule A

Employees access the system through roles.

---

Rule B

Permissions belong to roles.

---

Rule C

Attendance history is immutable.

---

Rule D

Payroll records are auditable.

---

Rule E

Employee documents are stored in Cloudinary.

---

Rule F

Suspended employees cannot access the system.

---

Rule G

Payroll creates financial transactions.

---

Rule H

Leave affects attendance.

---

Rule I

Historical employee data must remain intact.

---

Rule J

Security and accountability take precedence over convenience.

---

Rule K

Employees are organization-scoped; membership/role lives in organization_users and counts against the plan user limit.
