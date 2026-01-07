# System Flows

This document contains Mermaid diagrams for key system flows.

## Main Runtime Flow

```mermaid
graph TD
    A[User Opens App] --> B{Authenticated?}
    B -->|No| C[Login Page]
    B -->|Yes| D[Home Page]
    C --> E[Sign In/Up]
    E --> F[Supabase Auth]
    F --> G[Session Created]
    G --> D
    D --> H{User Action}
    H -->|Record| I[Record Page]
    H -->|Contacts| J[Contacts Page]
    H -->|History| K[History Page]
    H -->|Settings| L[Settings Page]
    I --> M[Start Recording]
    M --> N[Audio Capture]
    N --> O[Transcribe Audio]
    O --> P[Extract Entities]
    P --> Q[Generate Matches]
    Q --> R[Display Results]
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Supabase Auth
    participant D as Database

    U->>C: Enter email/password
    C->>S: signInWithPassword()
    S->>S: Validate credentials
    S->>D: Check auth.users
    D->>S: User record
    S->>C: JWT token + session
    C->>C: Store in localStorage
    C->>D: Fetch profile (RLS)
    D->>C: Profile data
    C->>U: Show authenticated UI
```

## Conversation Recording Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant M as MediaRecorder
    participant EF as Edge Function
    participant O as OpenAI
    participant DB as Database
    participant RT as Realtime

    U->>C: Click "Start Recording"
    C->>M: Start audio capture
    M->>C: Audio chunks (5s)
    C->>EF: transcribe-audio(chunk)
    EF->>O: Whisper API
    O->>EF: Transcript
    EF->>DB: Insert conversation_segments
    DB->>RT: Realtime event
    RT->>C: Update UI (live transcript)
    
    U->>C: Click "Stop Recording"
    C->>EF: extract-participants(conversationId)
    EF->>DB: Query segments
    EF->>O: GPT-4 (extract names)
    O->>EF: Participants
    EF->>DB: Insert conversation_participants
    
    C->>EF: extract-entities(conversationId)
    EF->>O: GPT-4 (extract investment criteria)
    O->>EF: Entities
    EF->>DB: Insert conversation_entities
    
    C->>EF: generate-matches(conversationId)
    EF->>DB: Query contacts + theses
    EF->>O: GPT-4 (score matches)
    O->>EF: Match suggestions
    EF->>DB: Insert match_suggestions
    DB->>RT: Realtime event
    RT->>C: Display matches
```

## Data Persistence Flow

```mermaid
graph LR
    A[User Action] --> B{Operation Type}
    B -->|CRUD| C[Supabase SDK]
    B -->|AI Processing| D[Edge Function]
    C --> E[PostgreSQL]
    D --> F[Service Role Client]
    F --> E
    E --> G[RLS Policy Check]
    G -->|Allowed| H[Execute Query]
    G -->|Denied| I[Return Error]
    H --> J[Return Data]
    J --> K[Update UI]
    E --> L[Realtime Trigger]
    L --> M[Broadcast to Subscribers]
    M --> K
```

## External Integrations Flow

```mermaid
graph TD
    A[User Action] --> B{Integration Type}
    B -->|Google Calendar| C[OAuth Flow]
    B -->|Contact Enrichment| D[Edge Function]
    B -->|AI Operations| E[Edge Function]
    
    C --> F[Express /api/auth/google/connect]
    F --> G[Google OAuth]
    G --> H[Callback Handler]
    H --> I[Store Tokens in DB]
    I --> J[Sync Calendar Events]
    J --> K[Edge Function: sync-google-calendar]
    K --> L[Google Calendar API]
    L --> K
    K --> M[Store in calendar_events]
    
    D --> N[Edge Function: enrich-contact]
    N --> O{Hunter.io or PDL?}
    O -->|Hunter| P[Hunter.io API]
    O -->|PDL| Q[People Data Labs API]
    P --> R[Enriched Data]
    Q --> R
    R --> S[Update contacts table]
    
    E --> T[Edge Function]
    T --> U[OpenAI API]
    U --> V[Process Results]
    V --> W[Update Database]
```

## User Journey: Making an Introduction

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant EF as Edge Function
    participant DB as Database
    participant E as Email System

    U->>C: View match suggestion
    C->>U: Show match card (1-3 stars)
    U->>C: Click "Promise Introduction"
    C->>DB: Update match_suggestions (promise_status)
    
    U->>C: Click "Generate Intro Email"
    C->>EF: generate-intro-email(matchId)
    EF->>DB: Fetch match + contacts
    EF->>EF: Generate email (GPT-4)
    EF->>C: Return email draft
    C->>U: Show email preview
    
    U->>C: Edit email (optional)
    U->>C: Click "Send to Contact A"
    C->>EF: Send intro email (Contact A)
    EF->>E: Send email
    EF->>DB: Insert introduction_messages
    DB->>C: Update UI (pending approval)
    
    Note over E,DB: Contact A receives email
    
    U->>C: Contact A approves
    C->>EF: Send intro email (Contact B)
    EF->>E: Send email
    EF->>DB: Update introduction_threads
    DB->>C: Show "Introduction Made"
```

## Contact Management Flow

```mermaid
graph TD
    A[User Action] --> B{Action Type}
    B -->|Create| C[Contact Form]
    B -->|Edit| D[Edit Contact]
    B -->|Import CSV| E[CSV Upload]
    B -->|Enrich| F[Enrich Contact]
    B -->|Delete| G[Delete Contact]
    
    C --> H[Validate with Zod]
    H --> I[Insert into contacts]
    I --> J[RLS Check]
    J --> K[Success]
    
    D --> L[Update contacts]
    L --> J
    
    E --> M[Parse CSV]
    M --> N[Validate Rows]
    N --> O[Batch Insert]
    O --> J
    
    F --> P[Edge Function: enrich-contact]
    P --> Q{Provider}
    Q -->|Hunter| R[Hunter.io API]
    Q -->|PDL| S[People Data Labs API]
    R --> T[Enriched Data]
    S --> T
    T --> U[Update contacts]
    U --> J
    
    G --> V[Delete from contacts]
    V --> J
    J --> W[Update UI via Realtime]
```

## Google Calendar Sync Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant E as Express
    participant G as Google
    participant EF as Edge Function
    participant DB as Database

    U->>C: Click "Connect Calendar"
    C->>E: GET /api/auth/google/connect?token=JWT
    E->>E: Validate JWT
    E->>E: Generate state token
    E->>G: Redirect to OAuth consent
    G->>U: Show consent screen
    U->>G: Grant permissions
    G->>E: GET /api/auth/google/callback?code=...
    E->>E: Validate state token
    E->>G: Exchange code for tokens
    G->>E: Access + refresh tokens
    E->>DB: Store tokens in user_preferences
    E->>C: Redirect to /settings?calendar=connected
    
    Note over C,DB: Background sync
    
    C->>EF: Trigger sync-google-calendar
    EF->>DB: Fetch user tokens
    EF->>G: List calendar events (sync token)
    G->>EF: Events + new sync token
    EF->>EF: Process events (dedupe, link)
    EF->>DB: Insert/update calendar_events
    EF->>DB: Update sync token
    DB->>C: Realtime update
    C->>U: Show upcoming meetings
```

## Match Generation Flow

```mermaid
graph TD
    A[Conversation Recorded] --> B[Extract Entities]
    B --> C[conversation_entities table]
    C --> D[Generate Matches]
    D --> E[Query All Contacts]
    E --> F[Query Contact Theses]
    F --> G[For Each Contact]
    G --> H{Has Thesis?}
    H -->|Yes| I[Score Match]
    H -->|No| J[Skip Contact]
    I --> K{Score >= Threshold?}
    K -->|Yes| L[Create match_suggestion]
    K -->|No| J
    L --> M[Store Reasons + Justification]
    M --> N[Display in UI]
    J --> O{More Contacts?}
    O -->|Yes| G
    O -->|No| N
```

## Security Flow: Ownership Validation

```mermaid
sequenceDiagram
    participant C as Client
    participant EF as Edge Function
    participant DB as Database
    participant A as Auth

    C->>EF: Invoke function (JWT in header)
    EF->>A: Verify JWT (supabase.auth.getUser)
    A->>EF: User ID
    EF->>DB: Query resource (e.g., conversation)
    DB->>EF: Resource + owned_by_profile
    EF->>EF: Check: user.id === owned_by_profile
    EF->>|Match| EF: Process request
    EF->>|No Match| EF: Return 403 Forbidden
    EF->>C: Return result or error
```

