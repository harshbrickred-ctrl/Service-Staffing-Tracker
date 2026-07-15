# Service Staffing Tracker — Documentation Index

## Purpose

Complete enterprise documentation for building **Service Staffing Tracker (SST)** from scratch. These docs are the system of record for product intent, architecture, and implementation standards.

## Audience

| Audience | Start here |
|----------|------------|
| New engineers | [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) |
| Product / BA | [00-initiation/VISION.md](./00-initiation/VISION.md) |
| Architects | [06-system-design/HIGH_LEVEL_ARCHITECTURE.md](./06-system-design/HIGH_LEVEL_ARCHITECTURE.md) |
| Security | [11-security/AUTH_RBAC.md](./11-security/AUTH_RBAC.md) |
| QA / SDET | [15-testing/TESTING_STRATEGY.md](./15-testing/TESTING_STRATEGY.md) |
| Ops | [17-local-deployment/LOCAL_SETUP.md](./17-local-deployment/LOCAL_SETUP.md) |

## Scope

| Label | Meaning |
|-------|---------|
| **MVP** | Build now: Excel hiring pipeline parity + Auth / RBAC / Audit |
| **Future** | Architected only: Bench, Skills, Capacity, Availability, Assignments, Workload |

**Excel source of truth:** `Service_Staffing_Tracker_Updated Version.xlsx`

## Reading order (recommended)

1. [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) — day-1 orientation  
2. [00-initiation](./00-initiation/) → [01-business-analysis](./01-business-analysis/) → [02-srs](./02-srs/) → [03-prd](./03-prd/)  
3. [04-domain](./04-domain/) → [05-ux](./05-ux/)  
4. [06-system-design](./06-system-design/) → [07-database](./07-database/) → [08-backend](./08-backend/) → [09-frontend](./09-frontend/) → [10-api](./10-api/) → [11-security](./11-security/)  
5. [12-planning](./12-planning/) → [13-monorepo](./13-monorepo/) → [14-standards](./14-standards/)  
6. [15-testing](./15-testing/) → [16-cicd](./16-cicd/) → [17-local-deployment](./17-local-deployment/) → [18-monitoring](./18-monitoring/)  
7. [19-cloud](./19-cloud/) → [20-maintenance](./20-maintenance/) → [21-guides](./21-guides/)  

## Document catalog

| Folder | Contents |
|--------|----------|
| `00-initiation` | Vision, project charter |
| `01-business-analysis` | FRs, NFRs, rules, personas, workflows, RTM |
| `02-srs` | IEEE-style Software Requirements Specification |
| `03-prd` | Product Requirements Document |
| `04-domain` | Domain model, processes, future modules |
| `05-ux` | IA, flows, wireframes, design system |
| `06-system-design` | HLA, C4, sequences, data flow, deployment, scale |
| `07-database` | ER/schema, Prisma, indexes/audit, migrations |
| `08-backend` | NestJS architecture, modules, cross-cutting |
| `09-frontend` | React architecture, features, auth/routing, state |
| `10-api` | Endpoint catalog, OpenAPI, errors/pagination |
| `11-security` | Auth/RBAC, permissions, OWASP, audit |
| `12-planning` | Epics/stories, sprints, dependencies |
| `13-monorepo` | Turborepo layout, packages, env/versioning |
| `14-standards` | Coding, git/PR, ADRs |
| `15-testing` | Strategy, structure, coverage |
| `16-cicd` | GitHub Actions, release/rollback |
| `17-local-deployment` | Local setup, Docker Compose, seed/migrate |
| `18-monitoring` | Observability, metrics/alerts |
| `19-cloud` | Cloud migration plan (future) |
| `20-maintenance` | Support, DR, incident |
| `21-guides` | Admin, user manual, FAQ |

## Definitions

| Term | Definition |
|------|------------|
| SST | Service Staffing Tracker |
| TA | Talent Acquisition |
| SPOC | Client Single Point of Contact |
| RAG | Red / Amber / Green SLA indicator |
| RTM | Requirement Traceability Matrix |
| ADR | Architecture Decision Record |

## Stack reference

Turborepo · pnpm · React · Vite · Tailwind · ShadCN · TanStack Query · React Router · RHF · Zod · Axios · NestJS · Prisma · PostgreSQL · JWT + Refresh · Passport · Swagger · Pino · Docker Compose · GitHub Actions · Prometheus · Grafana · Loki

## References

- Legacy workbook: repo root Excel file  
- Industry: IEEE 830 (SRS), C4 model, OWASP ASVS, 12-Factor App  
