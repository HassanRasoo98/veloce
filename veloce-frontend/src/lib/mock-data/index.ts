import type {
  AiAnalysis,
  Assignment,
  Brief,
  Note,
  StageEvent,
} from "@/types/veloce";
import { MOCK_USER_ADMIN, MOCK_USER_REVIEWER } from "@/types/veloce";

export const seedBriefs: Brief[] = [
  {
    id: "brf-001",
    title: "Customer portal redesign",
    descriptionRich:
      "## Goals\nModernize our B2B portal with SSO, billing history, and support tickets.\n\n## Stack preference\nReact-friendly stack.",
    budgetTier: "25k_50k",
    timelineUrgency: "standard",
    contactName: "Jordan Lee",
    contactEmail: "jordan@acmecorp.example",
    contactPhone: "+1 415 555 0100",
    stage: "new",
    submittedAt: "2026-03-15T14:00:00.000Z",
  },
  {
    id: "brf-002",
    title: "Field service mobile app",
    descriptionRich:
      "Technicians need offline-first iOS/Android app for work orders, signatures, and parts lookup.",
    budgetTier: "50k_100k",
    timelineUrgency: "urgent",
    contactName: "Sam Rivera",
    contactEmail: "sam@fieldfix.example",
    stage: "under_review",
    submittedAt: "2026-03-18T09:30:00.000Z",
  },
  {
    id: "brf-003",
    title: "RAG support bot over Confluence",
    descriptionRich:
      "Internal Slack bot that answers from Confluence + Jira using embeddings; must cite sources.",
    budgetTier: "25k_50k",
    timelineUrgency: "flexible",
    contactName: "Priya Shah",
    contactEmail: "priya@nimbus.example",
    stage: "under_review",
    submittedAt: "2026-03-20T11:15:00.000Z",
  },
  {
    id: "brf-004",
    title: "Salesforce ↔ NetSuite sync",
    descriptionRich:
      "Bidirectional sync for accounts, opportunities, and invoices with conflict resolution dashboard.",
    budgetTier: "10k_25k",
    timelineUrgency: "standard",
    contactName: "Alex Chen",
    contactEmail: "alex@mergeco.example",
    stage: "proposal_sent",
    submittedAt: "2026-03-10T16:45:00.000Z",
  },
  {
    id: "brf-005",
    title: "Invoice OCR pipeline",
    descriptionRich:
      "Automate AP: email inbox → OCR → ERP draft bills; exception queue for humans.",
    budgetTier: "50k_100k",
    timelineUrgency: "urgent",
    contactName: "Morgan Blake",
    contactEmail: "morgan@ledgerly.example",
    stage: "proposal_sent",
    submittedAt: "2026-03-22T08:00:00.000Z",
  },
  {
    id: "brf-006",
    title: "Marketing site + CMS",
    descriptionRich:
      "New corporate site with headless CMS, localization, and analytics events.",
    budgetTier: "10k_25k",
    timelineUrgency: "flexible",
    contactName: "Casey Ng",
    contactEmail: "casey@brightwave.example",
    stage: "won",
    submittedAt: "2026-02-28T10:00:00.000Z",
  },
  {
    id: "brf-007",
    title: "Legacy monolith strangler",
    descriptionRich:
      "Incremental extraction of auth and billing from Java monolith to services.",
    budgetTier: "100k_plus",
    timelineUrgency: "critical",
    contactName: "Taylor Kim",
    contactEmail: "taylor@oldstack.example",
    stage: "archived",
    submittedAt: "2026-01-12T13:20:00.000Z",
  },
  {
    id: "brf-008",
    title: "IoT device telemetry dashboard",
    descriptionRich:
      "Real-time dashboards for factory sensors; alerts and downtime correlation.",
    budgetTier: "25k_50k",
    timelineUrgency: "standard",
    contactName: "Riley Patel",
    contactEmail: "riley@fabric8.example",
    stage: "new",
    submittedAt: "2026-03-25T17:10:00.000Z",
  },
];

export const seedAnalyses: AiAnalysis[] = [
  {
    briefId: "brf-001",
    features: [
      "SSO integration",
      "Billing history views",
      "Support ticket ingestion",
      "Role-based access",
    ],
    category: "Web App",
    effortHoursMin: 120,
    effortHoursMax: 220,
    techStack: ["Next.js", "PostgreSQL", "Auth.js", "Stripe"],
    complexity: 3,
  },
  {
    briefId: "brf-002",
    features: [
      "Offline sync engine",
      "Work order CRUD",
      "Digital signatures",
      "Parts catalog search",
    ],
    category: "Mobile",
    effortHoursMin: 280,
    effortHoursMax: 420,
    techStack: ["React Native", "SQLite", "REST"],
    complexity: 5,
  },
  {
    briefId: "brf-003",
    features: [
      "Embedding pipeline",
      "Slack slash commands",
      "Citation rendering",
      "Access controls per space",
    ],
    category: "AI/ML",
    effortHoursMin: 160,
    effortHoursMax: 260,
    techStack: ["Python", "OpenAI API", "pgvector", "Slack Bolt"],
    complexity: 4,
  },
  {
    briefId: "brf-004",
    features: [
      "Entity mapping",
      "Scheduled sync jobs",
      "Conflict UI",
      "Audit log",
    ],
    category: "Integration",
    effortHoursMin: 90,
    effortHoursMax: 160,
    techStack: ["Node.js", "Salesforce API", "NetSuite SuiteScript"],
    complexity: 4,
  },
  {
    briefId: "brf-005",
    features: [
      "Email ingestion",
      "OCR + extraction",
      "Exception queue",
      "ERP connectors",
    ],
    category: "Automation",
    effortHoursMin: 200,
    effortHoursMax: 340,
    techStack: ["Python", "Temporal", "AWS Textract"],
    complexity: 5,
  },
  {
    briefId: "brf-006",
    features: [
      "Headless CMS",
      "i18n routing",
      "Design system",
      "Analytics instrumentation",
    ],
    category: "Web App",
    effortHoursMin: 80,
    effortHoursMax: 140,
    techStack: ["Next.js", "Sanity", "Vercel"],
    complexity: 2,
  },
  {
    briefId: "brf-007",
    features: [
      "Auth extraction",
      "Billing service boundary",
      "Strangler routing",
      "Data migration scripts",
    ],
    category: "Integration",
    effortHoursMin: 400,
    effortHoursMax: 800,
    techStack: ["Java", "Kubernetes", "Kafka"],
    complexity: 5,
  },
  {
    briefId: "brf-008",
    features: [
      "Time-series storage",
      "Live charts",
      "Alert rules",
      "Plant floor map overlays",
    ],
    category: "Web App",
    effortHoursMin: 140,
    effortHoursMax: 240,
    techStack: ["Next.js", "TimescaleDB", "WebSockets"],
    complexity: 4,
  },
];

export const seedStageEvents: StageEvent[] = [
  {
    id: "ev-001",
    briefId: "brf-002",
    fromStage: "new",
    toStage: "under_review",
    at: "2026-03-18T15:00:00.000Z",
    actorName: MOCK_USER_ADMIN.name,
  },
  {
    id: "ev-002",
    briefId: "brf-003",
    fromStage: "new",
    toStage: "under_review",
    at: "2026-03-21T09:00:00.000Z",
    actorName: MOCK_USER_ADMIN.name,
  },
  {
    id: "ev-003",
    briefId: "brf-004",
    fromStage: "under_review",
    toStage: "proposal_sent",
    at: "2026-03-12T10:00:00.000Z",
    actorName: MOCK_USER_ADMIN.name,
  },
  {
    id: "ev-004",
    briefId: "brf-005",
    fromStage: "under_review",
    toStage: "proposal_sent",
    at: "2026-03-23T11:30:00.000Z",
    actorName: MOCK_USER_ADMIN.name,
  },
  {
    id: "ev-005",
    briefId: "brf-006",
    fromStage: "proposal_sent",
    toStage: "won",
    at: "2026-03-05T14:00:00.000Z",
    actorName: MOCK_USER_ADMIN.name,
  },
  {
    id: "ev-006",
    briefId: "brf-007",
    fromStage: "proposal_sent",
    toStage: "archived",
    at: "2026-02-01T12:00:00.000Z",
    actorName: MOCK_USER_ADMIN.name,
  },
];

export const seedNotes: Note[] = [
  {
    id: "note-001",
    briefId: "brf-002",
    parentId: null,
    authorName: MOCK_USER_ADMIN.name,
    body: "Client is comparing us with two other vendors. Emphasize offline reliability.",
    at: "2026-03-19T10:00:00.000Z",
  },
  {
    id: "note-002",
    briefId: "brf-002",
    parentId: "note-001",
    authorName: MOCK_USER_REVIEWER.name,
    body: "Agreed — I’ll add a short architecture diagram for sync.",
    at: "2026-03-19T11:20:00.000Z",
  },
  {
    id: "note-003",
    briefId: "brf-003",
    parentId: null,
    authorName: MOCK_USER_REVIEWER.name,
    body: "Need legal sign-off on Confluence content retention.",
    at: "2026-03-21T14:00:00.000Z",
  },
  {
    id: "note-004",
    briefId: "brf-004",
    parentId: null,
    authorName: MOCK_USER_ADMIN.name,
    body: "Proposal sent with phased rollout estimate.",
    at: "2026-03-12T10:05:00.000Z",
  },
];

/** Reviewer is assigned to a subset of briefs (Module 02). */
export const seedAssignments: Assignment[] = [
  {
    id: "asg-001",
    briefId: "brf-002",
    assignedToId: MOCK_USER_REVIEWER.id,
    assignedToName: MOCK_USER_REVIEWER.name,
    assignedByName: MOCK_USER_ADMIN.name,
    at: "2026-03-18T15:05:00.000Z",
  },
  {
    id: "asg-002",
    briefId: "brf-003",
    assignedToId: MOCK_USER_REVIEWER.id,
    assignedToName: MOCK_USER_REVIEWER.name,
    assignedByName: MOCK_USER_ADMIN.name,
    at: "2026-03-21T09:05:00.000Z",
  },
  {
    id: "asg-003",
    briefId: "brf-004",
    assignedToId: MOCK_USER_REVIEWER.id,
    assignedToName: MOCK_USER_REVIEWER.name,
    assignedByName: MOCK_USER_ADMIN.name,
    at: "2026-03-11T16:00:00.000Z",
  },
  {
    id: "asg-004",
    briefId: "brf-005",
    assignedToId: MOCK_USER_REVIEWER.id,
    assignedToName: MOCK_USER_REVIEWER.name,
    assignedByName: MOCK_USER_ADMIN.name,
    at: "2026-03-22T12:00:00.000Z",
  },
];

export function buildAnalysisMap(
  list: AiAnalysis[],
): Map<string, AiAnalysis> {
  return new Map(list.map((a) => [a.briefId, a]));
}
