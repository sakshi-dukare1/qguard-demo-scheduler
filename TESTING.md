# 🧪 Testing Documentation — QGuard Demo Scheduler

This document summarizes the manual, API, and concurrency testing performed against the local development environment (`localhost:5000` backend, `localhost:3000` frontend) prior to deployment.

---

## 1. Manual End-to-End Flow Testing

Full visitor journey tested through the actual UI, per the required flow:
`QGuard Page → Enter Details → Select Time → Confirm → Email + Calendar Invite → Reschedule / Cancel`

| Step | Result |
|------|--------|
| Load booking page, fill visitor details | ✅ Pass |
| Select an available (non-booked, non-past) slot | ✅ Pass |
| Review & confirm modal shows correct details | ✅ Pass |
| Booking saved to Supabase `bookings` table, status `CONFIRMED` | ✅ Pass |
| Confirmation page displays correct name, email, date, time, and timezone | ✅ Pass |
| Confirmation email received via Resend | ✅ Pass |
| Email correctly shows time converted to the visitor's selected timezone | ✅ Pass |
| `.ics` calendar invite attached to email | ✅ Pass |
| `.ics` file successfully imported into Outlook calendar with correct date/time | ✅ Pass |
| Reschedule link loads booking and allows selecting a new slot | ✅ Pass |
| Rescheduling releases the old slot and books the new one | ✅ Pass |
| Cancel link updates booking status to `CANCELLED` | ✅ Pass |
| Cancelling releases the slot (confirmed via `/api/slots`) | ✅ Pass |

---

## 2. Double-Booking Prevention (Concurrency Testing)

**Why this matters:** a sequential "check, then insert" at the application level has a race-condition window — two requests arriving at nearly the same instant can both pass the "is this slot free?" check before either has written its row. The assessment explicitly requires prevention **at the backend/database level**, so this was tested with genuinely simultaneous requests rather than one-after-another manual clicks.

### Database constraint

```sql
CREATE UNIQUE INDEX unique_confirmed_slot
ON bookings (slot_start)
WHERE status = 'CONFIRMED';
```

Verified present via:
```sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'bookings';
```

### Concurrency test script

`backend/test-concurrency.js` fires two `POST /api/bookings` requests for the **same slot** using `Promise.allSettled`, so both requests are in flight at the same time rather than sequentially awaited.

```bash
node test-concurrency.js
```

**Result:**
```
🚀 Firing two simultaneous booking requests for the same slot...
Result statuses: [ 201, 409 ]
✅ PASS — exactly one booking succeeded, the other was correctly rejected.
```

One request succeeded (`201 Created`); the other was rejected with `409 Conflict` — caught by the Postgres unique constraint (`error.code === '23505'`) in `createBooking`, not merely by the earlier application-level check. This is the layer that actually closes the race condition.

The same constraint-violation handling is also applied in `rescheduleBooking`, so rescheduling into an already-taken slot is rejected the same way.

---

## 3. API Validation Testing (Postman)

Negative/validation testing against `POST /api/bookings` and `GET /api/bookings/:token`, confirming the API rejects bad input with clear, structured errors instead of crashing or silently accepting it.

| # | Test | Input | Expected | Actual | Result |
|---|------|-------|----------|--------|--------|
| 1 | Missing required field | No `visitor_name` | `400` | `400` — `"Name is required"` (+ related field messages) | ✅ Pass |
| 2 | Invalid email format | `visitor_email: "not-an-email"` | `400` | `400` — `"Please enter a valid email address"` | ✅ Pass |
| 3 | Invalid slot duration | 45-minute slot instead of 30 | `400` | `400` — `"Demo slot must be exactly 30 minutes"` | ✅ Pass |
| 4 | Past slot booking | `slot_start` in the past | `400` | `400` — `"Cannot book a slot in the past"` | ✅ Pass |
| 5 | Nonexistent booking token | `GET /api/bookings/invalid-fake-token-123` | `404` | `404` — `"Booking not found"` | ✅ Pass |

All error responses return structured JSON (`{ error: "..." }` or `{ success: false, errors: [...] }`) rather than raw stack traces or database error messages — avoiding leaking internal implementation details to the client.

---

## 4. Boundary & Edge-Case Testing

| Test | Result |
|------|--------|
| Requesting slots for a weekend date | `400` — `"Weekends are not available"` |
| Requesting slots for a date already partially/fully in the past | Past slots excluded from response (`isPast` filtered server-side, not just hidden in UI) |
| Rescheduling a `CANCELLED` booking | Rejected — `"Cannot reschedule cancelled booking"` |
| Cancelling an already-`CANCELLED` booking | Rejected — `"Booking already cancelled"` |

---

## 5. Timezone Testing

| Test | Result |
|------|--------|
| Auto-detected timezone on page load | Correctly detected via `moment.tz.guess()` |
| Changing timezone dropdown updates displayed slot times | ✅ Verified |
| Confirmation modal shows time in selected timezone | ✅ Verified |
| Confirmation page shows time in selected timezone | ✅ Verified |
| Confirmation email shows time in selected timezone (not server-local time) | ✅ Verified — fixed a bug where the email originally used server-local `toTimeString()` instead of the visitor's chosen timezone |
| Date-query bug: selecting a calendar date and converting it via `.utc()` before querying `/api/slots` could shift the requested date by a day for non-IST users | 🔧 Identified and fixed (removed unnecessary `.utc()` call in `fetchSlots`) |

---

## 6. Known Minor Issue (Not Blocking)

- The email validation chain runs an MX-record DNS lookup even on input that already failed the basic format check (e.g. `"not-an-email"`), because `express-validator`'s `.custom()` validators in the same chain all execute regardless of an earlier failure. This doesn't affect correctness (invalid emails are still correctly rejected with `400`), but it's unnecessary DNS work on obviously-invalid input. Flagged for future cleanup.

---

## 7. Local vs. Deployed Testing

All results above were captured against the **local** environment (`localhost:5000` / `localhost:3000`). This was intentional — local iteration is faster to debug, and a prior issue (Gmail SMTP failing with `ENETUNREACH` specifically on Render's network, invisible locally) demonstrated that environment-specific bugs exist independently of application logic. The same test suite (manual flow, concurrency script, Postman validation set) should be re-run against the deployed Render backend and Vercel frontend after deployment, using the same booking/date parameters adjusted to real future dates.

---

## Tools Used

- **Postman** — API request/response testing
- **Node.js script (`test-concurrency.js`)** — concurrent request simulation using `Promise.allSettled`
- **Manual browser testing** — Chrome, full user flow
- **Outlook desktop** — `.ics` calendar invite import verification
- **Supabase SQL Editor** — database constraint verification