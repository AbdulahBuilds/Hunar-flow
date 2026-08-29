# HUNAR — BUILD A FULLY INTERACTIVE DEMO WEBSITE

## IMPORTANT — READ THIS FIRST

You are **building the HUNAR website**, not creating a UI design presentation.

This must be a **fully interactive functional demo**.

When I open the website, I should feel like I am using a real HUNAR product.

I should be able to:

* Register/login
* Choose Customer or Worker
* Navigate through the platform
* Create a real demo job
* Add description, images, voice and location
* Post the job
* See worker offers
* Open worker profiles
* Select a worker
* Negotiate the visit charge
* Confirm a visit
* Move through the inspection process
* Negotiate the repair price
* Approve the repair
* Complete the job
* Complete the payment flow
* Submit a review

The worker should be able to perform the corresponding actions from the worker side.

### DO NOT BUILD:

* Static mockups
* Non-functional buttons
* Screens that are only visually connected
* Fake navigation
* Repeated dashboard screens with no functionality
* Buttons that do nothing
* Forms that cannot be submitted
* Flows that stop after one or two screens

### BUILD:

A connected, interactive product prototype where actions change the application state.

If a user performs an action on one screen, the result must be reflected in the relevant screens.

---

# 1. THE CORE HUNAR CONCEPT

HUNAR connects **customers who need a service** with **nearby skilled workers**.

The core lifecycle is:

**Customer creates problem**
→ **Workers send visit offers**
→ **Customer selects worker**

→ **Worker visits**
→ **Worker inspects problem**
→ **Repair price is negotiated**
→ **Customer approves repair**
→ **Worker completes repair**
→ **Customer pays**
→ **Customer reviews worker**

This lifecycle is the heart of the application.

Build the entire website around this lifecycle.

---

# 2. TWO SIDES OF THE APPLICATION

The application must have two clearly different experiences.

## CUSTOMER

The customer needs a simple experience focused on:

**Post a Problem → Find a Worker → Confirm Visit → Approve Repair → Pay**

## WORKER

The worker needs an experience focused on:

**Find Jobs → Send Offer → Visit Customer → Inspect → Get Approval → Complete Job → Get Paid**

Do not give both roles the same dashboard with different labels.

They have different goals and therefore need different interfaces.

---

# 3. STARTING EXPERIENCE

When the demo starts, show a professional HUNAR landing page.

The user should be able to:

**Find a Professional**

or

**Join as a Worker**

Also provide:

**Login**

and

**Create Account**

After login/registration, the user should enter the appropriate experience based on their role.

---

# 4. CUSTOMER FLOW — MUST BE FULLY INTERACTIVE

Implement this exact flow:

### STEP 1 — Register/Login

Customer creates an account.

After successful registration:

→ Customer Dashboard

---

### STEP 2 — Create Job

Customer clicks:

**Post a Job**

Show a multi-step job creation process.

#### Step 1 — Service

Select category:

* AC Repair
* Plumbing
* Electrician
* Carpenter
* Appliance Repair
* Painter
* Cleaning
* Other

#### Step 2 — Problem

Customer enters:

**Problem title**

Example:

> AC is running but not cooling.

Customer can enter a detailed description.

#### Step 3 — Media

Allow the customer to:

* Upload images
* Add multiple images
* Add voice description

For the demo, these can use simulated/mock functionality, but the UI must behave realistically.

For example:

**Record Voice**

→ recording state

→ stop

→ audio preview

→ delete/re-record

#### Step 4 — Location

Customer selects/adds location.

Show the selected location clearly.

#### Step 5 — Preferred Visit

Customer selects preferred date/time.

#### Step 6 — Review

Show everything entered:

* Category
* Problem
* Description
* Images
* Voice
* Location
* Preferred time

Button:

**Post Job**

---

# 5. AFTER POSTING

After clicking **Post Job**:

DO NOT simply show a success message and stop.

Create the actual job.

Show:

### Job Status

**Receiving Offers**

Display:

* Job ID
* Problem
* Category
* Location
* Date
* Status
* Number of offers

Example:

**3 Workers Interested**

---

# 6. WORKER OFFERS

The customer should receive multiple demo worker offers.

Example:

### Ali Khan

⭐ 4.9

245 jobs completed

Visit Charge:

**Rs. 300**

### Hamza Electrician

⭐ 4.7

180 jobs completed

Visit Charge:

**Rs. 250**

### Usman Services

⭐ 4.8

310 jobs completed

Visit Charge:

**Rs. 350**

Each worker card must have:

**View Profile**

and

**View Offer**

---

# 7. WORKER PROFILE

When the customer opens a worker:

Show a realistic professional profile.

Include:

* Profile photo
* Name
* Verification badge
* Rating
* Reviews
* Skills
* Experience
* Completed jobs
* Portfolio
* Service area
* Availability
* Visit charge

The customer should be able to return to the offers without losing their job state.

---

# 8. SELECT WORKER

Customer clicks:

**Select Worker**

Show confirmation:

> You are selecting Ali Khan for this job.

Display:

* Worker
* Rating
* Visit charge
* Estimated details

Buttons:

**Confirm Selection**

**Cancel**

After confirmation:

Job status becomes:

**Visit Charge Negotiation**

---

# 9. VISIT CHARGE NEGOTIATION

This must be an actual interactive negotiation screen.

Show:

**Worker Visit Charge: Rs. 300**

Customer can:

**Accept Rs. 300**

or

**Make Counter Offer**

Customer enters:

**Rs. 275**

Worker side must see the new offer.

Worker can:

**Accept**

or

**Counter Offer**

Example:

Customer:

Rs. 275

Worker:

Rs. 300

Customer:

Rs. 285

Worker:

Rs. 285 — Accepted

Then:

**Visit Confirmed**

The agreed amount becomes locked.

---

# 10. VISIT CONFIRMATION

Show:

### Visit Confirmed

Worker:

Ali Khan

Visit Charge:

**Rs. 285**

Date:

**August 30**

Time:

**4:00 PM**

Location:

Customer location

Buttons:

**View Details**

**Cancel Visit**

The worker must also see this appointment on their dashboard.

---

# 11. WORKER ARRIVES

The worker's job status should progress through:

**Visit Confirmed**

→

**On The Way**

→

**Arrived**

→

**Inspection**

These statuses should be controlled through worker actions.

For example:

Worker clicks:

**Start Visit**

Customer sees:

**Worker is on the way**

Worker clicks:

**I've Arrived**

Customer sees:

**Worker has arrived**

---

# 12. INSPECTION

Worker opens:

**Inspection**

Show:

Problem:

> AC is not cooling.

Worker can enter:

### Inspection Result

Example:

> AC capacitor is damaged.

### Required Repair

> Replace capacitor.

### Repair Estimate

**Rs. 700**

Worker clicks:

**Submit Inspection**

Customer receives the inspection result.

---

# 13. REPAIR PRICE NEGOTIATION

Customer sees:

### Inspection Complete

Visit Charge:

**Rs. 285**

Repair Estimate:

**Rs. 700**

Total:

**Rs. 985**

Customer can:

**Approve Rs. 700**

or

**Negotiate**

Example:

Customer offers:

**Rs. 600**

Worker sees:

**Customer offered Rs. 600**

Worker can:

* Accept
* Counter offer
* Reject

Example negotiation:

Rs. 700

↓

Rs. 600

↓

Rs. 650

↓

**Agreed: Rs. 650**

---

# 14. APPROVE REPAIR

Once both sides agree:

Show:

### Repair Agreement

Visit:

**Rs. 285**

Repair:

**Rs. 650**

Total:

**Rs. 935**

Customer clicks:

**Approve Repair**

The job status changes to:

**Repair Approved**

Worker sees the same status.

---

# 15. REPAIR IN PROGRESS

Worker clicks:

**Start Repair**

Job becomes:

**Repair In Progress**

Customer dashboard must immediately reflect the updated status.

Worker then clicks:

**Mark Repair Complete**

---

# 16. JOB COMPLETION

Show:

### Job Completed

Service:

AC Repair

Visit:

Rs. 285

Repair:

Rs. 650

Total:

**Rs. 935**

Customer clicks:

**Proceed to Payment**

---

# 17. PAYMENT

Create a realistic demo payment screen.

Show:

**Total Payable: Rs. 935**

Payment options:

* Demo Wallet
* Cash
* Card

Since this is a demo, actual payment processing is not required.

But the interaction must work.

For example:

**Pay Rs. 935**

→ Payment Processing

→ Payment Successful

→ Job status becomes:

**Paid**

---

# 18. REVIEW

After payment:

Show:

### How was your experience?

Customer selects:

⭐⭐⭐⭐⭐

and writes:

> Excellent service. Very professional and quick.

Click:

**Submit Review**

The review should then appear on the worker's profile.

Worker's rating/review count should update in the demo state.

---

# 19. WORKER FLOW

The worker side must be equally functional.

Implement:

**Register**

→

**Create Worker Profile**

→

**Select Skills**

→

**Add Experience**

→

**Add Service Areas**

→

**Upload Profile Picture**

→

**Verification**

→

**Worker Dashboard**

---

# 20. WORKER DASHBOARD

Worker dashboard should show:

### Nearby Jobs

Job cards containing:

* Category
* Problem
* Location
* Distance
* Images
* Description
* Posted time
* Preferred visit time

Worker clicks:

**View Job**

---

# 21. WORKER JOB DETAILS

Show complete customer request.

Worker can:

**Send Visit Offer**

Enter:

**Rs. 300**

Then:

**Submit Offer**

The customer should now see this offer.

Do not fake this transition.

The shared demo state should update.

---

# 22. WORKER OFFER STATUS

Worker should see:

* Offer Sent
* Customer Viewing
* Counter Offer
* Accepted
* Rejected

If customer negotiates:

Worker receives the counter offer.

Worker can accept or counter again.

---

# 23. WORKER ACTIVE JOB

After customer selects the worker:

Show:

### Active Job

Customer information

Problem

Location

Appointment

Visit charge

Status

Actions:

**Start Visit**

**I've Arrived**

**Start Inspection**

**Submit Inspection**

**Start Repair**

**Complete Repair**

The available action should depend on the current job status.

---

# 24. CUSTOMER DASHBOARD

Customer dashboard should clearly show:

### Active Jobs

Example:

**AC Repair**

Status:

**Inspection**

### Upcoming Visits

Ali Khan

Today — 4:00 PM

### Pending Offers

2 offers

### Recent Jobs

Completed services

### Total Spent

Demo amount

---

# 25. JOB DETAILS PAGE

Create a detailed timeline.

Example:

✓ Job Posted

✓ Worker Selected

✓ Visit Confirmed

✓ Worker Arrived

✓ Inspection Completed

✓ Repair Price Agreed

✓ Repair Approved

● Repair In Progress

○ Payment

○ Review

This timeline should update dynamically.

---

# 26. NAVIGATION

## CUSTOMER

Sidebar/mobile navigation:

* Dashboard
* Post a Job
* My Jobs
* Offers
* Upcoming Visits
* Payments
* Reviews
* Notifications
* Profile
* Settings

## WORKER

Sidebar/mobile navigation:

* Dashboard
* Nearby Jobs
* My Offers
* Active Jobs
* Upcoming Visits
* Completed Jobs
* Earnings
* Reviews
* Notifications
* Profile
* Settings

Every navigation item must work.

---

# 27. SEARCH & FILTERS

Workers should be able to filter jobs by:

* Category
* Distance
* Price
* Date
* Job type

Customers should be able to search/filter workers by:

* Skill
* Rating
* Distance
* Experience
* Availability

Filters must actually modify the displayed demo data.

---

# 28. EMPTY STATES

Do not leave empty pages blank.

Create proper states for:

### No Jobs

> No active jobs yet.

Button:

**Post Your First Job**

### No Offers

> We're waiting for professionals to respond.

### No Nearby Jobs

> No jobs found in your service area.

### No Notifications

> You're all caught up.

### No Reviews

> Reviews will appear after completing jobs.

---

# 29. ERROR STATES

Implement realistic errors.

Examples:

### Login

> Incorrect email or password.

### Job Creation

> Please select a service category.

### Location

> Unable to access location.

### Offer

> Please enter a valid visit charge.

### Payment

> Payment failed. Please try again.

### Network

> Something went wrong. Please try again.

Errors should appear through proper UI feedback such as inline validation, alerts, modals, or toast notifications.

---

# 30. CANCELLATION FLOWS

Implement cancellation properly.

Customer can cancel where appropriate.

Worker can decline/cancel where appropriate.

Before cancellation:

Show confirmation modal:

> Are you sure you want to cancel this visit?

Options:

**Keep Visit**

**Cancel Visit**

After cancellation, update the job status and show the appropriate reason/state.

---

# 31. NOTIFICATIONS

Create a functional notification system.

Examples:

Customer receives:

**Ali Khan sent you a visit offer of Rs. 300.**

**Ali Khan accepted your counter offer of Rs. 285.**

**Ali Khan has arrived.**

**Inspection report is ready.**

**Repair price has been agreed.**

**Job completed.**

**Payment successful.**

Worker receives:

**New nearby job available.**

**Customer selected you.**

**Customer sent a counter offer of Rs. 275.**

**Customer approved the repair.**

**Payment completed.**

Clicking a notification should take the user to the relevant screen.

---

# 32. DEMO STATE

Use realistic mock data and frontend state.

The most important requirement:

### ACTIONS MUST CHANGE STATE.

Example:

If customer accepts a worker:

Before:

**Select Worker**

After:

**Worker Selected**

If worker submits an inspection:

Before:

**Waiting for Inspection**

After:

**Inspection Available**

If customer approves repair:

Before:

**Awaiting Approval**

After:

**Repair Approved**

If worker completes repair:

Before:

**Repair In Progress**

After:

**Payment Pending**

If customer pays:

Before:

**Payment Pending**

After:

**Paid**

If customer reviews:

Before:

**Review Pending**

After:

**Reviewed**

---

# 33. COMPLETE SCREEN INVENTORY

Build all necessary screens, including:

### Public

* Landing
* Services
* Worker Directory
* Worker Profile
* Login
* Register

### Customer

* Dashboard
* Create Job
* Job Details
* Worker Offers
* Worker Profile
* Visit Negotiation
* Visit Details
* Inspection
* Repair Negotiation
* Repair Approval
* Payment
* Review
* Job History
* Notifications
* Profile
* Settings

### Worker

* Dashboard
* Profile Setup
* Verification
* Nearby Jobs
* Job Details
* Send Offer
* My Offers
* Negotiation
* Upcoming Visits
* Active Job
* Inspection
* Repair
* Completion
* Earnings
* Reviews
* Notifications
* Profile
* Settings

---

# 34. UI QUALITY

Use a professional marketplace design.

The interface should be:

* Modern
* Clean
* Trustworthy
* Responsive
* Consistent
* Easy to understand

Use:

* Clear typography
* Strong visual hierarchy
* Professional cards
* Status badges
* Progress indicators
* Good spacing
* Meaningful icons
* Clear CTAs
* Proper confirmation dialogs
* Toast notifications
* Loading states

Do not overcrowd screens.

---

# 35. FINAL ACCEPTANCE TEST

Before considering the HUNAR demo complete, test this exact scenario:

### CUSTOMER

Login

→ Post AC repair job

→ Add description

→ Add images

→ Add voice

→ Add location

→ Post

→ Receive 3 worker offers

→ Open worker profile

→ Select worker

→ Negotiate visit charge

→ Confirm visit

→ Track worker

→ Receive inspection

→ Negotiate repair price

→ Approve repair

→ Track repair

→ Payment

→ Review

### WORKER

Login

→ View nearby AC job

→ Open job

→ Send visit offer

→ Receive customer counter offer

→ Accept negotiated amount

→ See confirmed visit

→ Start visit

→ Mark arrived

→ Inspect problem

→ Submit inspection

→ Receive repair negotiation

→ Accept repair price

→ Start repair

→ Complete repair

→ See payment completed

→ Receive customer review

### THIS ENTIRE SCENARIO MUST BE POSSIBLE IN THE DEMO.

If any major step ends in a static screen, the implementation is incomplete.

---

# MOST IMPORTANT REQUIREMENT

**Do not optimize for the number of screens. Optimize for the quality and completeness of the user journey.**

I do not want to see 50 beautiful screens that are disconnected.

I want to see a smaller number of screens that are **properly connected and functional**.

The final HUNAR website should feel like a real product being used by a real customer and a real worker.

**Build the experience, not just the design.**
