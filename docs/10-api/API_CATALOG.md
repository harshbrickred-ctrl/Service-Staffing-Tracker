# API Catalog — SST REST API

## Purpose

Normative endpoint catalog for MVP `/api/v1`.

## Audience

Backend, frontend, QA.

## Scope

MVP resources. Workforce endpoints Future.

## Definitions

| Term | Definition |
|------|------------|
| publicId | Business id e.g. `REQ-00001` |
| UUID | Internal path id unless noted |

Base URL: `http://localhost:3000/api/v1`  
Auth: `Authorization: Bearer <accessToken>` unless Public.

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | `{ email, password }` → tokens + user |
| POST | `/auth/refresh` | Cookie/body | New access token |
| POST | `/auth/logout` | Auth | Revoke refresh |
| GET | `/auth/me` | Auth | Current user |

### Login request/response

```json
// request
{ "email": "admin@example.com", "password": "********" }
// response 200
{
  "accessToken": "eyJ...",
  "user": { "id": "...", "email": "...", "fullName": "...", "role": "ADMIN" }
}
```

---

## Users (Admin)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/users` | ADMIN | Paginated users |
| POST | `/users` | ADMIN | Create |
| PATCH | `/users/:id` | ADMIN | Update role/active |
| POST | `/users/:id/reset-password` | ADMIN | Set temp password |

---

## Master data

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/master-data/lookups/:type` | Auth | List values |
| POST | `/master-data/lookups/:type` | ADMIN | Create |
| PATCH | `/master-data/lookups/:type/:id` | ADMIN | Update |
| GET/POST/PATCH | `/master-data/clients` | GET Auth; mutate ADMIN/SALES | Clients |
| GET/POST/PATCH | `/master-data/job-families` | GET Auth; mutate ADMIN | Job families |

`type` ∈ `PRIORITY|CANDIDATE_STAGE|FEEDBACK|OFFER_STATUS|ONBOARDING_STATUS|BGV_STATUS|REQUIREMENT_STATUS`

---

## Requirements

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/requirements` | SALES,TA,ADMIN,LEADERSHIP | List + filters |
| GET | `/requirements/:id` | same | Detail + derived SLA/open/closed |
| POST | `/requirements` | SALES,ADMIN | Create |
| PATCH | `/requirements/:id` | SALES,ADMIN,TA(limited) | Update |
| POST | `/requirements/:id/status` | SALES,ADMIN | Status transition |

### Create body (example)

```json
{
  "requirementDate": "2026-07-07",
  "clientId": "uuid",
  "roleSkill": "Core Python Developer",
  "jobFamilyId": "uuid",
  "numberOfPositions": 5,
  "salesOwnerId": "uuid",
  "priorityCode": "HIGH",
  "taOwnerId": "uuid",
  "taHandoffDate": "2026-07-07",
  "targetClosureDate": "2026-07-09",
  "minBudget": 1000000,
  "maxBudget": 1500000,
  "durationMonths": 12,
  "jobLocation": "Bangalore",
  "experience": "5+ years",
  "remarks": null
}
```

### Response includes derived

`requirementAgeDays`, `taHandoffSlaRag`, `openPositions`, `closedPositions`, `publicId`

Filters: `taOwnerId`, `salesOwnerId`, `priorityCode`, `clientId`, `jobFamilyId`, `status`, `from`, `to`, `q`, `page`, `pageSize`, `sort`

---

## Candidates

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/candidates` | TA,SALES,ADMIN,LEADERSHIP | List |
| GET | `/candidates/:id` | same | Detail + duplicate flags |
| POST | `/candidates` | TA,ADMIN | Create |
| PATCH | `/candidates/:id` | TA,ADMIN | Update |
| POST | `/candidates/:id/select` | TA,ADMIN | `{ selected: true\|false }` |

### Create body

```json
{
  "requirementId": "uuid",
  "name": "Yogesh kumar",
  "mobile": "8527172822",
  "email": "yogeshsingh1996@gmail.com",
  "source": "Referral",
  "stageCode": "SUBMITTED_TO_SPOC",
  "feedbackCode": "PENDING",
  "profileSubmittedDate": "2026-07-10"
}
```

---

## Offers

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/offers` | HR,TA,ADMIN,LEADERSHIP | List |
| GET | `/offers/:id` | same | Detail |
| POST | `/offers` | HR,TA,ADMIN | Create for selected candidate |
| PATCH | `/offers/:id` | HR,ADMIN | Update dates/CTC |
| POST | `/offers/:id/status` | HR,ADMIN | Status transition |

```json
{
  "candidateId": "uuid",
  "offerInitiatedDate": "2026-07-12",
  "offerReleasedDate": "2026-07-13",
  "statusCode": "RELEASED",
  "ctcRate": "18 LPA",
  "expectedDoj": "2026-08-01",
  "remarks": null
}
```

---

## Onboardings

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/onboardings` | HR,ADMIN,LEADERSHIP | List |
| GET | `/onboardings/:id` | same | Detail |
| POST | `/onboardings` | HR,ADMIN | From accepted offer |
| PATCH | `/onboardings/:id` | HR,ADMIN | Update |
| POST | `/onboardings/:id/status` | HR,ADMIN | Status / Joined |

```json
{
  "offerId": "uuid",
  "hrOwnerId": "uuid",
  "docsPending": true,
  "bgvStatusCode": "NOT_STARTED",
  "joiningFormalities": "",
  "expectedDoj": "2026-08-01"
}
```

---

## Dashboard

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/dashboard/summary` | Auth | KPI cards |
| GET | `/dashboard/breakdowns` | Auth | Stage + RAG tables |
| GET | `/dashboard/escalations` | Auth | At risk, overdue, cancelled, wasted |

Query filters same as dashboard Excel filters.

### Summary response (example)

```json
{
  "totalRequirements": 8,
  "totalPositions": 17,
  "openPositions": 16,
  "closedPositions": 1,
  "pendingSalesHandoff": 0,
  "candidatesInPipeline": 5,
  "selectedCandidates": 1,
  "duplicateMobiles": 0,
  "offersReleased": 0,
  "offersAccepted": 0,
  "candidatesJoined": 0,
  "fillRate": 0.0588
}
```

---

## Audit / Import / Health

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/audit-logs` | ADMIN | Filtered audit |
| POST | `/imports/validate` | ADMIN | Upload CSV validate |
| POST | `/imports/commit` | ADMIN | Commit import |
| GET | `/health` | Public | Liveness |
| GET | `/ready` | Public | DB readiness |
| GET | `/metrics` | Internal | Prometheus |

## Versioning

URI version `/api/v1`. Breaking changes → `/api/v2`.

## References

- [OPENAPI_CONVENTIONS.md](./OPENAPI_CONVENTIONS.md)  
- [ERRORS_PAGINATION_FILTERING.md](./ERRORS_PAGINATION_FILTERING.md)  
- [../01-business-analysis/REQUIREMENT_TRACEABILITY_MATRIX.md](../01-business-analysis/REQUIREMENT_TRACEABILITY_MATRIX.md)  
