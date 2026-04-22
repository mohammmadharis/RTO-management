# RTO Agent Management System — Customer Entry Form
## Full Production-Level Prompt & Specification

---

## 🧭 PROJECT CONTEXT

Build a **Customer Entry Form** for an RTO (Regional Transport Office) Agent Management System.

The RTO agent handles all vehicle and licence-related services on behalf of customers. When a new customer walks in, the agent fills this form. The form captures customer details, vehicle details, the specific RTO service being done, and payment information.

After submission, the system must:
- Save the record to the database
- Auto-tag payment status
- Schedule automatic WhatsApp + SMS reminders
- Update the live agent dashboard

---

## 🛠️ TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Styling | Tailwind CSS |
| Form Management | React Hook Form |
| Validation | Zod |
| Date Picker | react-datepicker |
| Toast Notifications | react-hot-toast |
| Backend API | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| WhatsApp | Wati API |
| SMS | MSG91 |
| Payments | Razorpay |

---

## 📋 COMPLETE FORM SPECIFICATION

---

### 🔵 SECTION 1 — Customer Information

| # | Field Name | Type | Required | Rules |
|---|---|---|---|---|
| 1 | Full Name | Text Input | ✅ Yes | Min 3 chars, alphabets only |
| 2 | Mobile Number | Number Input | ✅ Yes | Exactly 10 digits, starts with 6-9 |
| 3 | WhatsApp Number | Number Input | ✅ Yes | Exactly 10 digits |
| 3a | Same as Mobile | Checkbox | — | If checked, auto-copy Mobile → WhatsApp |
| 4 | Email Address | Email Input | ❌ No | Valid email format |
| 5 | Address | Textarea | ❌ No | Max 250 chars |
| 6 | City | Text Input | ❌ No | — |
| 7 | State | Dropdown | ❌ No | All Indian states list |
| 8 | Pincode | Number Input | ❌ No | Exactly 6 digits |

---

### 🔵 SECTION 2 — Vehicle Information

| # | Field Name | Type | Required | Rules |
|---|---|---|---|---|
| 9 | Vehicle Registration Number | Text Input | ✅ Yes | Auto UPPERCASE, Format: MH12AB1234 |
| 10 | Vehicle Type | Dropdown | ✅ Yes | See options below |
| 11 | Vehicle Category | Dropdown | ✅ Yes | Depends on Vehicle Type |
| 12 | Vehicle Brand / Make | Text Input | ✅ Yes | e.g. Honda, Maruti, Bajaj, Tata |
| 13 | Vehicle Model | Text Input | ✅ Yes | e.g. Activa, Swift, Pulsar, Nexon |
| 14 | Manufacturing Year | Dropdown | ✅ Yes | 1990 to current year |
| 15 | Fuel Type | Dropdown | ✅ Yes | See options below |
| 16 | Engine Number | Text Input | ❌ No | Alphanumeric |
| 17 | Chassis Number | Text Input | ❌ No | Alphanumeric |
| 18 | Colour | Text Input | ❌ No | e.g. Red, White, Silver |

#### Vehicle Type Options:
```
Two Wheeler
  - Motorcycle (Geared)
  - Scooter / Moped (Gearless)
  - Electric Two Wheeler

Three Wheeler
  - Auto Rickshaw (Passenger)
  - Auto Rickshaw (Goods)
  - E-Rickshaw
  - Tempo

Four Wheeler — Private
  - Hatchback
  - Sedan
  - SUV / MUV
  - Compact SUV
  - Electric Car

Four Wheeler — Commercial
  - Taxi / Cab
  - School Bus
  - Private Bus
  - Mini Bus
  - Tourist Vehicle
  - Ambulance
  - Police Vehicle

Light Commercial Vehicle (LCV)
  - Mini Truck / Pickup
  - Light Goods Vehicle
  - Van

Heavy Commercial Vehicle (HCV)
  - Truck (2 Axle)
  - Truck (3 Axle / Multi Axle)
  - Tipper
  - Tanker
  - Container Truck
  - Trailer

Agricultural / Special
  - Tractor
  - Power Tiller
  - Harvester
  - Crane / Construction Equipment

Other
```

#### Fuel Type Options:
```
Petrol
Diesel
CNG (Compressed Natural Gas)
LPG (Liquefied Petroleum Gas)
Electric (EV)
Hybrid (Petrol + Electric)
Hybrid (Diesel + Electric)
Hydrogen
Other
```

---

### 🔵 SECTION 3 — RTO Service Information

> ⚠️ CRITICAL SECTION — This is the heart of the form.
> An agent can add MULTIPLE services for the same customer in one entry.
> For each service selected, show its specific sub-fields.

| # | Field Name | Type | Required | Rules |
|---|---|---|---|---|
| 19 | Service Category | Dropdown | ✅ Yes | See full list below |
| 20 | Service Sub-Type | Dropdown | ✅ Yes | Depends on category selected |
| 21 | Service Start Date | Date Picker | ✅ Yes | Cannot be future date |
| 22 | Service Expiry Date | Date Picker | Conditional | Required for expiry-based services |
| 23 | Document Number / Reference | Text Input | ❌ No | Policy no, RC no, DL no etc. |
| 24 | Issuing Authority / Office | Text Input | ❌ No | e.g. RTO Pune, IRDAI |
| 25 | Reminder Alert Days | Radio | ✅ Yes | 30 days / 15 days / 7 days (default: 30) |
| 26 | Notes / Remarks | Textarea | ❌ No | Internal agent notes, max 300 chars |

#### ➕ Add Another Service Button
Allow agent to add multiple services for the same customer. Each service block shows all fields above independently.

---

### 📦 COMPLETE RTO SERVICE CATEGORIES & SUB-TYPES

---

#### 🏷️ 1. INSURANCE SERVICES
```
1.1  Third Party Insurance (TP) — New
1.2  Third Party Insurance (TP) — Renewal
1.3  Comprehensive Insurance — New
1.4  Comprehensive Insurance — Renewal
1.5  Zero Depreciation Add-On Insurance
1.6  Engine Protection Insurance
1.7  Return to Invoice (RTI) Insurance
1.8  Roadside Assistance Insurance
1.9  Personal Accident Cover (Owner-Driver)
1.10 Passenger Cover Insurance
1.11 Commercial Vehicle Insurance — New
1.12 Commercial Vehicle Insurance — Renewal
1.13 Two Wheeler Insurance — New
1.14 Two Wheeler Insurance — Renewal
1.15 Insurance Endorsement (Changes in existing policy)
1.16 Insurance Cancellation
1.17 Duplicate Insurance Certificate
```
> Fields: Policy Number, Insurance Company, Insured Value (IDV), Premium Amount, Policy Start Date, Policy Expiry Date

---

#### 🏷️ 2. VEHICLE REGISTRATION SERVICES
```
2.1  New Vehicle Registration (Private)
2.2  New Vehicle Registration (Commercial)
2.3  Temporary Registration (TR)
2.4  Permanent Registration Certificate (RC)
2.5  RC Renewal (After 15 years for private)
2.6  RC Renewal (Commercial — every 5 years)
2.7  Duplicate RC (Lost / Damaged)
2.8  RC Smart Card Conversion
2.9  Change of Address in RC
2.10 Change of Vehicle Colour in RC
2.11 Change of Engine in RC
2.12 Change of Chassis in RC
2.13 Conversion of Vehicle Category (e.g. Private to Commercial)
2.14 Re-Registration (Vehicle shifted to different state)
2.15 Cancellation of Registration
2.16 Vehicle Scrapping / De-Registration
```
> Fields: RC Number, Registration Date, Validity Date, Form Number (Form 20 / 26 etc.)

---

#### 🏷️ 3. TAX SERVICES
```
3.1  Road Tax — One Time (Lifetime Tax)
3.2  Road Tax — Annual
3.3  Road Tax — Quarterly
3.4  Green Tax — Private Vehicle (15+ years)
3.5  Green Tax — Commercial Vehicle (8+ years)
3.6  Green Tax Renewal
3.7  Professional Tax (for drivers)
3.8  Road Tax Clearance Certificate
3.9  Tax Exemption Application (for EVs / government vehicles)
3.10 Penalty / Fine Payment for Tax Default
```
> Fields: Tax Period From, Tax Period To, Tax Amount, Challan Number, Payment Date

---

#### 🏷️ 4. DRIVING LICENCE SERVICES
```
4.1  Learner's Licence (LL) — New Application
4.2  Learner's Licence — Retest
4.3  Permanent Driving Licence (DL) — New
4.4  Driving Licence — Renewal
4.5  Duplicate Driving Licence (Lost / Damaged)
4.6  Driving Licence — International Driving Permit (IDP)
4.7  Driving Licence — Addition of Vehicle Class
4.8  Driving Licence — Removal of Vehicle Class
4.9  Driving Licence — Change of Address
4.10 Driving Licence — Change of Name
4.11 Driving Licence — Change of Date of Birth
4.12 Driving Licence — Smart Card Conversion
4.13 Driving Licence — Surrender / Cancellation
4.14 Driving Licence — Extract (Certified Copy)
4.15 Heavy Licence (HMV / HGMV / HMVT)
4.16 PSV Badge (Public Service Vehicle Badge for drivers)
4.17 Badge Renewal
```
> Fields: DL Number, DL Issue Date, DL Expiry Date, Vehicle Classes (LMV / MCWG / TRANS etc.), LL Number (if applicable)

---

#### 🏷️ 5. FITNESS CERTIFICATE SERVICES
```
5.1  Fitness Certificate — New (Commercial Vehicles)
5.2  Fitness Certificate — Renewal
5.3  Fitness Certificate — Inspection Report
5.4  Fitness Certificate — Re-inspection (after rejection)
5.5  Fitness Extension Application
5.6  Duplicate Fitness Certificate
```
> Fields: Fitness Certificate Number, Issue Date, Expiry Date, Inspection Centre Name, Inspector Name

---

#### 🏷️ 6. POLLUTION UNDER CONTROL (PUC) SERVICES
```
6.1  PUC Certificate — New
6.2  PUC Certificate — Renewal
6.3  PUC Duplicate Certificate
6.4  PUC Test Reapplication (after failure)
```
> Fields: PUC Certificate Number, Test Date, Expiry Date (valid for 6 months), PUC Centre Name

---

#### 🏷️ 7. PERMIT SERVICES (Commercial Vehicles)
```
7.1  National Permit — New (All India Tourist Permit)
7.2  National Permit — Renewal
7.3  State Permit — New
7.4  State Permit — Renewal
7.5  Contract Carriage Permit — New
7.6  Contract Carriage Permit — Renewal
7.7  Stage Carriage Permit (Bus Routes) — New
7.8  Stage Carriage Permit — Renewal
7.9  Goods Carriage Permit — New
7.10 Goods Carriage Permit — Renewal
7.11 Tourist Vehicle Permit — New
7.12 Tourist Vehicle Permit — Renewal
7.13 Temporary Permit
7.14 Special Permit (for Oversized / Abnormal Load)
7.15 Permit Endorsement (Route / Condition changes)
7.16 Permit Duplicate
7.17 Permit Surrender / Cancellation
7.18 Counter Signature of Permit (when vehicle enters other state)
```
> Fields: Permit Number, Permit Type, Route Details, Valid From, Valid To, Issuing State

---

#### 🏷️ 8. OWNERSHIP TRANSFER SERVICES
```
8.1  Transfer of Ownership — Sale (Form 29 + 30)
8.2  Transfer of Ownership — Inheritance / Succession
8.3  Transfer of Ownership — Court Order
8.4  Transfer of Ownership — Auction Sale
8.5  Transfer of Ownership — Gift Deed
8.6  NOC for Transfer to Another State
8.7  NOC for Sale — Hypothecation Removal
8.8  Duplicate NOC
```
> Fields: Seller Name, Buyer Name, Sale Amount, Sale Date, Form 29 Number, Form 30 Number, New Owner Mobile

---

#### 🏷️ 9. HYPOTHECATION / LOAN SERVICES
```
9.1  Hypothecation Addition (HP Endorsement — when vehicle is on loan)
9.2  Hypothecation Continuation (for loan renewal)
9.3  Hypothecation Termination / Removal (after loan closure)
9.4  Duplicate RC with Hypothecation Details
9.5  Hire Purchase Agreement Endorsement
```
> Fields: Bank / Financier Name, Loan Account Number, HP Endorsement Date, HP Termination Date

---

#### 🏷️ 10. EMISSION & ENVIRONMENTAL SERVICES
```
10.1 Bharat Stage Compliance Certificate
10.2 EV (Electric Vehicle) Registration — Special Process
10.3 CNG / LPG Conversion Certificate
10.4 CNG / LPG Kit Endorsement in RC
10.5 Green Tax Exemption for EV
10.6 Alternate Fuel Conversion Application
```
> Fields: Fuel Type Changed To, Conversion Date, Certifying Agency

---

#### 🏷️ 11. VEHICLE MODIFICATION SERVICES
```
11.1 Body Type Change (e.g. Open → Covered)
11.2 Seating Capacity Change
11.3 Gross Vehicle Weight (GVW) Change
11.4 CNG / LPG Kit Installation
11.5 Special Equipment Installation (Ambulance fit-out, etc.)
11.6 Structural Modification — RTO Approval
11.7 Vehicle Colour Change
11.8 Wheel Base Modification
```
> Fields: Modification Type, Modified By (Workshop name), Modification Date, RTO Approval Number

---

#### 🏷️ 12. CHALLAN / FINE SERVICES
```
12.1 Traffic Challan Payment
12.2 Overloading Fine
12.3 Without Helmet / Seatbelt Fine
12.4 Without Insurance Fine
12.5 Without Licence Fine
12.6 Without PUC Fine
12.7 Without RC Fine
12.8 Drunk Driving Fine
12.9 Signal / Speed Violation Fine
12.10 Challan Dispute / Appeal
12.11 Court Case Clearance
```
> Fields: Challan Number, Offence Date, Offence Location, Fine Amount, Court Case Number (if applicable)

---

#### 🏷️ 13. SPECIAL / MISCELLANEOUS SERVICES
```
13.1  VIP / Fancy Number Allotment
13.2  Number Plate Change (HSRP — High Security Registration Plate)
13.3  HSRP Booking — Two Wheeler
13.4  HSRP Booking — Four Wheeler
13.5  Vehicle NOC for Out-of-State Use
13.6  Vehicle Particulars Certificate
13.7  Vehicle Valuation Certificate
13.8  Road Worthiness Certificate
13.9  Police NOC (for duplicate documents)
13.10 Certified Copy of RC
13.11 Certified Copy of DL
13.12 Court/Legal NOC
13.13 Aadhar Seeding in RC / DL
13.14 Mobile Number Update in RC / DL
13.15 Photo / Signature Update in DL
13.16 Address Change in DL
13.17 Other (Manual entry)
```

---

### 🔵 SECTION 4 — Payment Information

| # | Field Name | Type | Required | Rules |
|---|---|---|---|---|
| 27 | Total Service Amount | Number Input (₹) | ✅ Yes | Must be > 0 |
| 28 | Advance / Partial Payment | Number Input (₹) | ✅ Yes | Cannot exceed Total Amount |
| 29 | Due Amount | Read-only (₹) | — | Auto: Due = Total - Advance. Red if > 0 |
| 30 | Payment Mode (Advance) | Dropdown | ✅ Yes | Cash / UPI / Bank Transfer / Cheque |
| 31 | UPI Transaction ID / Ref No. | Text Input | Conditional | Show if UPI or Bank Transfer selected |
| 32 | Cheque Number | Text Input | Conditional | Show if Cheque selected |
| 33 | Bank Name | Text Input | Conditional | Show if Cheque or Bank Transfer selected |
| 34 | Advance Paid Date | Date Picker | ✅ Yes | Cannot be future date |
| 35 | Expected Due Date | Date Picker | Conditional | Show only if Due Amount > 0 |
| 36 | Agent Commission (Internal) | Number Input (₹) | ❌ No | Hidden from customer, for agent records |

---

### 🟢 AUTO-GENERATED FIELDS (System fills automatically, hidden from form)

| Field | Logic |
|---|---|
| Customer ID | Auto-increment: CUS-001, CUS-002 ... |
| Entry Date | Today's date and time |
| Entry By | Logged-in agent's name |
| Payment Status | `Pending` if Advance = 0 / `Due` if Advance < Total / `Paid` if Advance = Total |
| Service Status | `Active` if within validity / `Expiring Soon` if within 30 days / `Expired` if past expiry |
| WhatsApp Trigger | Fire confirmation message immediately on save |
| Expiry Alert Job | Schedule cron job based on Expiry Date - Reminder Days |
| Due Reminder Job | Schedule weekly cron job if Due Amount > 0 |
| Razorpay Link | Auto-generate payment link if Due > 0 (included in WhatsApp message) |

---

## ⚡ POST-SAVE AUTOMATION FLOW

```
Customer Form Submitted
        │
        ▼
[ Validate All Fields ]
        │
        ├── ❌ Validation fails → Show field-level errors, do NOT submit
        │
        ▼
[ Save to Database ]
        │
        ├── Generate Customer ID (CUS-XXX)
        ├── Calculate Due Amount
        ├── Tag Payment Status (Paid / Due / Pending)
        ├── Tag Service Status (Active / Expiring / Expired)
        │
        ▼
[ Trigger WhatsApp Message (Wati API) ]
        │
        ├── Send to Customer WhatsApp Number
        ├── Message: Confirmation of service registration
        ├── Include: Service type, expiry date, amount paid, balance due
        └── If Due > 0: Include Razorpay payment link
        │
        ▼
[ Trigger SMS (MSG91) ] ← Backup if WhatsApp fails
        │
        ▼
[ Schedule Expiry Reminder (Node-Cron) ]
        │
        ├── Calculate: Expiry Date - Reminder Days (30/15/7)
        ├── On that date: Auto WhatsApp + SMS to customer
        └── Message: "Your [Service] expires on [Date]. Renew now."
        │
        ▼
[ Schedule Due Payment Reminder (Node-Cron) ]
        │
        ├── If Due > 0: Send every Monday at 10 AM
        ├── Message: "You have ₹[Amount] pending. Pay now: [Link]"
        └── Stop when payment marked as Paid
        │
        ▼
[ Update Agent Dashboard (Real-time) ]
        │
        ├── Add new customer to customer list
        ├── Update Paid / Due / Pending count cards
        ├── Show activity feed: "CUS-001 Ramesh Sharma added — Due ₹3,000"
        └── Show toast: "✅ Customer saved successfully!"
        │
        ▼
[ Redirect to Customer List Page ]
```

---

## 📊 PAYMENT STATUS LOGIC

```javascript
if (advancePaid === 0) {
  paymentStatus = "PENDING"   // 🔴 Red badge
} else if (advancePaid < totalAmount) {
  paymentStatus = "DUE"       // 🟡 Yellow badge
} else if (advancePaid === totalAmount) {
  paymentStatus = "PAID"      // 🟢 Green badge
}
```

---

## 📊 SERVICE STATUS LOGIC

```javascript
const today = new Date()
const expiryDate = new Date(serviceExpiryDate)
const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))

if (daysLeft < 0) {
  serviceStatus = "EXPIRED"         // 🔴 Red
} else if (daysLeft <= 30) {
  serviceStatus = "EXPIRING SOON"   // 🟠 Orange
} else {
  serviceStatus = "ACTIVE"          // 🟢 Green
}
```

---

## ✅ VALIDATION RULES

```
Full Name         → Required | Min 3 chars | Letters + spaces only
Mobile Number     → Required | Exactly 10 digits | Starts with 6, 7, 8, or 9
WhatsApp Number   → Required | Same rules as Mobile
Vehicle Number    → Required | Must be uppercase | Regex: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/
Vehicle Type      → Required | Must select one option
Vehicle Brand     → Required | Min 2 chars
Vehicle Model     → Required | Min 2 chars
Service Category  → Required | Must select
Service Sub-Type  → Required | Must select
Service Start Date → Required | Cannot be in future
Service Expiry Date → Conditional Required | Must be after Start Date
Total Amount      → Required | Must be > 0 | Number only
Advance Paid      → Required | Must be >= 0 | Cannot exceed Total Amount
Payment Mode      → Required | Must select
Advance Paid Date → Required | Cannot be in future
UPI Ref No.       → Required if Payment Mode = UPI or Bank Transfer
Cheque No.        → Required if Payment Mode = Cheque
Expected Due Date → Required if Due Amount > 0
```

---

## 📱 WHATSAPP MESSAGE TEMPLATES

### Template 1 — Service Confirmation (Sent immediately on save)
```
Dear {customer_name},

Your RTO service has been registered successfully. ✅

📋 Service Details:
• Service: {service_type}
• Vehicle: {vehicle_number}
• Start Date: {start_date}
• Expiry Date: {expiry_date}

💰 Payment Summary:
• Total Amount: ₹{total_amount}
• Amount Paid: ₹{advance_paid}
• Balance Due: ₹{due_amount}

{if due_amount > 0}
👉 Pay your balance here:
{razorpay_link}
{/if}

For any queries, contact us.
Thank you! 🙏
```

### Template 2 — Expiry Reminder (Auto, X days before expiry)
```
Dear {customer_name},

⚠️ Service Expiry Reminder

Your {service_type} for vehicle {vehicle_number} is expiring on {expiry_date}.

Only {days_left} days remaining!

Please renew immediately to avoid penalties and legal issues.

📞 Contact us to renew:
{agent_phone}

— {agent_name}
```

### Template 3 — Due Payment Reminder (Weekly)
```
Dear {customer_name},

💳 Payment Reminder

You have a pending balance of ₹{due_amount} for your {service_type}.

Vehicle: {vehicle_number}

Please clear your due at the earliest.

👉 Pay now:
{razorpay_link}

📞 {agent_phone}
```

### Template 4 — Payment Received Confirmation
```
Dear {customer_name},

✅ Payment Received!

Amount: ₹{payment_amount}
Service: {service_type}
Vehicle: {vehicle_number}
Date: {payment_date}

Your account is now fully cleared. Thank you! 🙏

— {agent_name}
```

---

## 🎨 UI / DESIGN REQUIREMENTS

- **Framework:** React.js + Tailwind CSS
- **Layout:** Single page, scrollable, clearly divided sections
- **Section Headers:** Colored bar with section number and title
- **Required Fields:** Red asterisk (*) next to label
- **Due Amount Field:** Turns red automatically when Due > 0
- **Payment Status Badge:** Updates live as agent types — Pending (red) / Due (yellow) / Paid (green)
- **Mobile Responsive:** Works on phone and tablet
- **Auto UPPERCASE:** Vehicle number field auto-converts to uppercase
- **Conditional Fields:** Show/hide based on selection (UPI ref, cheque no, expected due date)
- **Add Service Button:** Allows adding multiple services per customer
- **Progress Indicator:** Show which section agent is currently on
- **Form Autosave:** Save draft every 30 seconds to localStorage (prevent data loss)

---

## 🗃️ DATABASE SCHEMA

### Table: customers
```sql
id              SERIAL PRIMARY KEY
customer_id     VARCHAR(10) UNIQUE   -- CUS-001
full_name       VARCHAR(100) NOT NULL
mobile          VARCHAR(10) NOT NULL
whatsapp        VARCHAR(10) NOT NULL
email           VARCHAR(100)
address         TEXT
city            VARCHAR(50)
state           VARCHAR(50)
pincode         VARCHAR(6)
created_at      TIMESTAMP DEFAULT NOW()
created_by      VARCHAR(50)          -- Agent name
```

### Table: vehicles
```sql
id              SERIAL PRIMARY KEY
customer_id     VARCHAR(10) REFERENCES customers(customer_id)
vehicle_number  VARCHAR(15) NOT NULL
vehicle_type    VARCHAR(50)
vehicle_category VARCHAR(50)
brand           VARCHAR(50)
model           VARCHAR(50)
year            INTEGER
fuel_type       VARCHAR(20)
engine_number   VARCHAR(50)
chassis_number  VARCHAR(50)
colour          VARCHAR(30)
```

### Table: services
```sql
id              SERIAL PRIMARY KEY
customer_id     VARCHAR(10) REFERENCES customers(customer_id)
vehicle_id      INTEGER REFERENCES vehicles(id)
service_category   VARCHAR(50) NOT NULL
service_sub_type   VARCHAR(100) NOT NULL
document_number    VARCHAR(100)
start_date         DATE
expiry_date        DATE
reminder_days      INTEGER DEFAULT 30
service_status     VARCHAR(20)  -- ACTIVE / EXPIRING / EXPIRED
notes              TEXT
created_at         TIMESTAMP DEFAULT NOW()
```

### Table: payments
```sql
id              SERIAL PRIMARY KEY
service_id      INTEGER REFERENCES services(id)
customer_id     VARCHAR(10) REFERENCES customers(customer_id)
total_amount    DECIMAL(10,2) NOT NULL
advance_paid    DECIMAL(10,2)
due_amount      DECIMAL(10,2)
payment_status  VARCHAR(10)   -- PAID / DUE / PENDING
payment_mode    VARCHAR(20)   -- CASH / UPI / BANK / CHEQUE
upi_ref         VARCHAR(100)
cheque_number   VARCHAR(50)
bank_name       VARCHAR(100)
advance_date    DATE
due_date        DATE
agent_commission DECIMAL(10,2)
razorpay_link   VARCHAR(300)
created_at      TIMESTAMP DEFAULT NOW()
```

### Table: reminders (for cron job tracking)
```sql
id              SERIAL PRIMARY KEY
service_id      INTEGER REFERENCES services(id)
customer_id     VARCHAR(10)
reminder_type   VARCHAR(20)  -- EXPIRY / DUE_PAYMENT
scheduled_date  DATE
status          VARCHAR(20)  -- PENDING / SENT / FAILED
sent_at         TIMESTAMP
message_template VARCHAR(20)
```

---

## 🔗 API ENDPOINTS

```
POST   /api/customers          → Create new customer entry
GET    /api/customers          → Get all customers (dashboard list)
GET    /api/customers/:id      → Get single customer detail
PUT    /api/customers/:id      → Update customer info
DELETE /api/customers/:id      → Delete customer

POST   /api/vehicles           → Add vehicle
PUT    /api/vehicles/:id       → Update vehicle

POST   /api/services           → Add service for a customer
PUT    /api/services/:id       → Update service
GET    /api/services/expiring  → Get services expiring within 30 days

POST   /api/payments           → Record payment
PUT    /api/payments/:id       → Update payment (mark paid)
GET    /api/payments/due       → Get all due payments

POST   /api/whatsapp/send      → Send WhatsApp message
POST   /api/sms/send           → Send SMS

GET    /api/dashboard/stats    → Paid / Due / Pending counts
GET    /api/dashboard/activity → Recent activity feed
```

---

## ⚙️ CRON JOB SCHEDULE

```javascript
// Runs every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {

  // Check services expiring in X days
  const expiring = await getServicesExpiringIn([30, 15, 7])
  for (const service of expiring) {
    await sendWhatsApp(service.customer.whatsapp, 'EXPIRY_REMINDER', service)
    await sendSMS(service.customer.mobile, 'EXPIRY_REMINDER', service)
    await logReminder(service.id, 'EXPIRY')
  }

  // Check due payments — send every Monday
  if (isMonday()) {
    const dues = await getDuePayments()
    for (const payment of dues) {
      await sendWhatsApp(payment.customer.whatsapp, 'DUE_REMINDER', payment)
      await sendSMS(payment.customer.mobile, 'DUE_REMINDER', payment)
      await logReminder(payment.service_id, 'DUE_PAYMENT')
    }
  }

})
```

---

## 📌 FORM BUTTONS

| Button | Action |
|---|---|
| `+ Add Another Service` | Adds a new service block below the current one |
| `SAVE & SUBMIT` | Validates → Saves → Fires WhatsApp → Redirects to list |
| `CLEAR FORM` | Resets all fields to blank with confirmation dialog |
| `SAVE AS DRAFT` | Saves without submitting (no WhatsApp triggered) |
| `← Back` | Goes back to dashboard without saving |

---

## 🏁 SUMMARY

This entry form is the **single source of truth** for the entire RTO Agent system. Every automation — WhatsApp alerts, SMS reminders, expiry tracking, payment follow-ups, dashboard updates — is triggered by data entered here.

The form covers **13 service categories** with **130+ service sub-types**, all real RTO services used in India. Build it once. It runs the entire operation automatically.

---

*End of Specification*
*Version: 1.0 | Author: Haris Freelancer | Date: April 2026*
