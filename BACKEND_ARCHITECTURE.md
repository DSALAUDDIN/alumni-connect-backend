# Alumni Connect Super App — Backend Architecture

> **Status:** Foundation Complete ✅ | Build: Passing ✅
> **Last Updated:** 2026-03-02

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript, Strict mode) |
| Database | PostgreSQL via **Prisma ORM v7** |
| Caching / Rate Limiting | Redis (`ioredis`) *(wired, pending full integration)* |
| Real-time | Socket.io (`@nestjs/websockets`) |
| File Storage | Cloudinary SDK |
| Push Notifications | Firebase Admin SDK (FCM) |
| Email | Nodemailer (SMTP) |
| Security | Helmet + Throttler (100 req/min) + Helmet middleware |
| Validation | `class-validator` + `class-transformer` + Global `ValidationPipe` |
| API Docs | Swagger UI at `/api/docs` |

---

## Project Structure

```
src/
├── main.ts                          # Bootstrap: Swagger, Helmet, ValidationPipe
├── app.module.ts                    # Root module: all imports
│
├── core/
│   ├── prisma/
│   │   ├── prisma.service.ts        # @Global PrismaService (lifecycle hooks)
│   │   └── prisma.module.ts         # @Global exported
│   └── notifications/
│       ├── notifications.service.ts # FCM push, Nodemailer email, health checks
│       └── notifications.module.ts  # @Global exported
│
├── health/          → GET  /health
├── auth/            → POST /auth/email-otp, /auth/verify-email, /auth/firebase-auth (Phone)
├── users/           → GET/PATCH/DELETE /users, /users/:id
├── feed/            → GET/POST/DELETE /feed, /feed/:id, /feed/:id/like
├── groups/          → CRUD /groups + POST /groups/:id/join, DELETE /groups/:id/leave
├── marketplace/     → CRUD /marketplace
├── events/          → CRUD /events + POST /events/:id/rsvp
├── chat/            → POST /chat/send, GET /chat/conversation/:userId, /chat/room/:roomId
├── emergency/       → POST /emergency, GET /emergency, PATCH /emergency/:id/resolve
├── jobs/            → CRUD /jobs
├── mentorship/      → POST /mentorship, PATCH /mentorship/:id/accept|complete
├── projects/        → CRUD /projects
└── admin/           → GET /admin/stats, /admin/users/recent, PATCH /admin/users/:id/role
```

---

## API Routes Summary

| Method | Route | Module | Description |
|---|---|---|---|
| `GET` | `/health` | Health | System health check (DB, Email, Firebase) |
| `POST` | `/auth/email-otp` | Auth | Send OTP to email via Nodemailer |
| `POST` | `/auth/verify-email`| Auth | Validate email OTP and get JWT |
| `POST` | `/auth/firebase-auth`| Auth | Validate Firebase token (Phone OTP) |
| `GET` | `/users` | Users | Alumni directory (with `?search=`) |
| `GET` | `/users/:id` | Users | View a profile |
| `PATCH` | `/users/:id` | Users | Update profile |
| `DELETE` | `/users/:id` | Users | Delete account |
| `GET` | `/feed` | Feed | Global / group feed |
| `POST` | `/feed` | Feed | Create a post |
| `GET` | `/feed/:id` | Feed | Post detail + comments |
| `DELETE` | `/feed/:id` | Feed | Delete a post |
| `POST` | `/feed/:id/like` | Feed | Toggle like |
| `GET` | `/groups` | Groups | List all groups |
| `POST` | `/groups` | Groups | Create group |
| `GET` | `/groups/:id` | Groups | Group detail + members |
| `POST` | `/groups/:id/join` | Groups | Join a group |
| `DELETE` | `/groups/:id/leave` | Groups | Leave a group |
| `GET` | `/marketplace` | Marketplace | Browse listings |
| `POST` | `/marketplace` | Marketplace | List item for sale |
| `GET` | `/marketplace/:id` | Marketplace | Item detail |
| `DELETE` | `/marketplace/:id` | Marketplace | Remove listing |
| `GET` | `/events` | Events | Upcoming events |
| `POST` | `/events` | Events | Create event |
| `GET` | `/events/:id` | Events | Event detail + RSVPs |
| `POST` | `/events/:id/rsvp` | Events | RSVP to event |
| `POST` | `/chat/send` | Chat | Send a message |
| `GET` | `/chat/conversation/:userId` | Chat | DM history |
| `GET` | `/chat/room/:roomId` | Chat | Group chat history |
| `GET` | `/emergency` | Emergency | Active alerts |
| `POST` | `/emergency` | Emergency | Report alert (triggers FCM push) |
| `PATCH` | `/emergency/:id/resolve` | Emergency | Resolve alert |
| `GET` | `/jobs` | Jobs | Job listings |
| `POST` | `/jobs` | Jobs | Post a job |
| `GET` | `/jobs/:id` | Jobs | Job details |
| `DELETE` | `/jobs/:id` | Jobs | Remove listing |
| `POST` | `/mentorship` | Mentorship | Request a mentor |
| `GET` | `/mentorship` | Mentorship | All connections |
| `PATCH` | `/mentorship/:id/accept` | Mentorship | Mentor accepts |
| `PATCH` | `/mentorship/:id/complete` | Mentorship | Mark complete |
| `GET` | `/projects` | Projects | Browse projects |
| `POST` | `/projects` | Projects | Create project |
| `GET` | `/projects/:id` | Projects | Project details |
| `DELETE` | `/projects/:id` | Projects | Delete project |
| `GET` | `/admin/stats` | Admin | Platform statistics |
| `GET` | `/admin/users/recent` | Admin | Recently joined users |
| `PATCH` | `/admin/users/:id/role` | Admin | Change user role |

---

## Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Post : "creates"
    User ||--o{ Comment : "writes"
    User ||--o{ Like : "gives"
    User ||--o{ GroupMember : "joins"
    User ||--o{ EventRSVP : "attends"
    User ||--o{ Job : "posts"
    User ||--o{ Project : "leads"
    User ||--o{ Message : "sends"
    User ||--o{ MarketplaceItem : "sells"
    User ||--o{ EmergencyAlert : "reports"
    User ||--o{ Mentorship : "mentors or mentees"

    Post ||--o{ Comment : "has"
    Post ||--o{ Like : "has"

    Group ||--o{ GroupMember : "contains"
    Group ||--o{ Post : "contains"

    Event ||--o{ EventRSVP : "has"

    User {
        string id PK
        string email UK
        string phone UK
        string firstName
        string lastName
        string avatarUrl
        enum role "ALUMNI|STUDENT|ADMIN|SUPER_ADMIN"
        boolean isVerified
        boolean isEmailVerified
        int graduationYear
        string degree
        string department
        string institution
        string currentCompany
        string currentRole
        string motto
        string[] skills
        string fcmToken
        string deviceModel
        float lat
        float lng
        string otpCode
        datetime otpExpiry
        enum status "PENDING|ACTIVE|BLOCKED"
        datetime createdAt
        datetime updatedAt
    }

    Post {
        string id PK
        string content
        string[] mediaUrls
        string authorId FK
        string groupId FK
        datetime createdAt
        datetime updatedAt
    }

    Comment {
        string id PK
        string content
        string postId FK
        string authorId FK
        datetime createdAt
    }

    Like {
        string id PK
        string postId FK
        string authorId FK
        datetime createdAt
    }

    Group {
        string id PK
        string name UK
        string description
        boolean isPrivate
        datetime createdAt
        datetime updatedAt
    }

    GroupMember {
        string id PK
        string groupId FK
        string userId FK
        enum role "MEMBER|ADMIN|MODERATOR"
        datetime joinedAt
    }

    MarketplaceItem {
        string id PK
        string title
        string description
        float price
        string[] mediaUrls
        enum status "AVAILABLE|SOLD|HIDDEN"
        string sellerId FK
        datetime createdAt
        datetime updatedAt
    }

    Event {
        string id PK
        string title
        string description
        datetime date
        string location
        boolean isOnline
        datetime createdAt
        datetime updatedAt
    }

    EventRSVP {
        string id PK
        string eventId FK
        string userId FK
        enum status "GOING|MAYBE|NOT_GOING"
        datetime createdAt
    }

    Message {
        string id PK
        string content
        string senderId FK
        string receiverId FK
        string chatRoomId
        datetime createdAt
    }

    EmergencyAlert {
        string id PK
        enum type "BLOOD_DONATION|MEDICAL|SECURITY|NATURAL_DISASTER|OTHER"
        string message
        string location
        enum status "ACTIVE|RESOLVED"
        string reportedById FK
        datetime createdAt
        datetime resolvedAt
    }

    Job {
        string id PK
        string title
        string company
        string description
        string location
        string salary
        enum type "FULL_TIME|PART_TIME|CONTRACT|INTERNSHIP"
        string postedById FK
        datetime createdAt
        datetime expiresAt
    }

    Mentorship {
        string id PK
        string mentorId
        string menteeId
        enum status "PENDING|ACTIVE|COMPLETED|CANCELLED"
        string topic
        string notes
        datetime createdAt
        datetime updatedAt
    }

    Project {
        string id PK
        string title
        string description
        string repoUrl
        enum status "PLANNING|ONGOING|COMPLETED|ARCHIVED"
        string leaderId FK
        datetime createdAt
        datetime updatedAt
    }
```

---

## Global Architecture Patterns

### Global Modules
Both `PrismaModule` and `NotificationsModule` are marked `@Global()`. This means:
- Any feature module can inject `PrismaService` or `NotificationsService` **without importing these modules explicitly**.

### Throttling
`ThrottlerModule` is configured globally with **100 requests/minute** per IP. The `ThrottlerGuard` is applied as an `APP_GUARD`, protecting every route automatically.

### Validation
A global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` is applied in `main.ts`. Any request body property not defined in the DTO is automatically **stripped and rejected**.

### Security Headers
`Helmet` middleware is applied at the Express level in `main.ts` to set secure HTTP headers.

---

## Environment Variables (`/.env`)

```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/alumni_connect_db"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
```

---

## Next Steps (Phase 2)

- [ ] **JWT Auth Guard** — Implement `@nestjs/passport` + `passport-jwt` 
- [ ] **Email OTP Flow** — Add `POST /auth/email-otp` to send 6-digit PIN via `Nodemailer`
- [ ] **Verify Email OTP Flow** — Add `POST /auth/verify-email` to validate PIN and issue JWT
- [ ] **Redis Integration** — Add `ioredis` for session caching and `/health` Redis check
- [ ] **Socket.io Gateway** — Add `ChatGateway` for real-time messaging
- [ ] **Cloudinary Upload** — Add upload endpoints in `users` (avatar) and `feed` (media)
- [ ] **Migrations** — Run `prisma migrate dev` after PostgreSQL is provisioned
- [ ] **RBAC Guards** — Admin-only route protection
- [ ] **Pagination** — Cursor-based pagination on all list endpoints
- [ ] **Swagger decorators** — Add `@ApiResponse` on all endpoints
