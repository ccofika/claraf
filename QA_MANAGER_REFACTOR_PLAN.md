# QA Manager Refactor Plan - URL-Based Routing

## CILJ
Pretvoriti QAManager iz single-page tab-based navigacije u proper URL-based routing:
- `/qa-manager/dashboard`
- `/qa-manager/agents`
- `/qa-manager/tickets`
- `/qa-manager/tickets/:ticketId` (view)
- `/qa-manager/tickets/:ticketId/edit`
- `/qa-manager/archive`
- `/qa-manager/analytics`
- `/qa-manager/summaries`
- `/qa-manager/import`
- `/qa-manager/all-agents` (admin)
- `/qa-manager/statistics` (admin)
- `/qa-manager/active-overview` (admin)
- `/qa-manager/bugs` (admin)

---

## ANALIZA TRENUTNOG STANJA

### Fajl: `src/pages/QAManager.jsx`
- **Ukupno linija:** 4477
- **Komponenta:** Monolitna, sadrži sve tabove, dialoge, funkcije

### STATE VARIJABLE (50+)

#### GLOBALNI STATE (koristi se na više tabova)
| State | Tip | Koristi se u |
|-------|-----|--------------|
| `user` | object | Svi tabovi (auth) |
| `loading` | boolean | Svi tabovi |
| `agents` | array | Dashboard, Agents, Tickets (dropdown) |
| `allExistingAgents` | array | SendTicketModal |
| `agentsForFilter` | array | Tickets, Archive (filter) |
| `graders` | array | Tickets, Archive (filter) |
| `tickets` | array | Tickets, Archive |
| `pagination` | object | Tickets, Archive |
| `ticketsFilters` | object | Tickets |
| `archiveFilters` | object | Archive |

#### DIALOG STATE (globalni - koriste se sa bilo kog taba)
| State | Tip | Opis |
|-------|-----|------|
| `agentDialog` | object | Create/Edit agent modal |
| `addExistingAgentDialog` | object | Add existing agent modal |
| `similarAgentDialog` | object | Similar agent confirmation |
| `ticketDialog` | object | Create/Edit ticket modal |
| `deleteDialog` | object | Delete confirmation modal |
| `gradeDialog` | object | Grade ticket modal |
| `feedbackDialog` | object | Edit feedback modal |
| `viewDialog` | object | View ticket modal |
| `manageMacrosDialog` | object | Manage macros modal |
| `chooseMacroDialog` | object | Choose macro modal |
| `saveAsMacroDialog` | object | Save as macro modal |
| `sendMacroDialog` | object | Send ticket to grader modal |
| `pendingMacroTickets` | array | Incoming tickets from other graders |
| `declineConfirmDialog` | object | Decline ticket confirmation |
| `assignmentsDialog` | object | View assignments modal |
| `assignments` | array | Assignments data |
| `unsavedChangesModal` | object | Unsaved changes warning |

#### TAB-SPECIFIC STATE
| State | Tab | Opis |
|-------|-----|------|
| `dashboardStats` | Dashboard | Statistics data |
| `expandedAgentId` | Agents | Expanded agent for issues |
| `agentIssues` | Agents | Agent issues data |
| `validationErrors` | Agents/Tickets | Validation state |
| `focusedTicketIndex` | Tickets/Archive | Keyboard navigation |
| `selectedTickets` | Tickets/Archive | Multi-select |
| `sortConfig` | Tickets/Archive | Sort configuration |
| `extensionLogs` | Dashboard | Extension log messages |
| `extensionActive` | Dashboard | Extension status |

#### REFS
| Ref | Opis |
|-----|------|
| `ticketFormDataRef` | Ticket form data (avoid re-renders) |
| `hasUnsavedChangesRef` | Track unsaved changes |
| `originalFormDataRef` | Original form data for comparison |
| `searchInputRef` | Search input focus |
| `ticketListRef` | Ticket list scroll |
| `extensionLogsRef` | Extension logs scroll |
| `prevTabRef` | Previous tab for validation |

---

### FUNKCIJE (60+)

#### API Funkcije
- `getAuthHeaders()` - Auth headers helper
- `fetchDashboardStats()` - Dashboard stats
- `fetchAgents()` - User's agents
- `fetchAllExistingAgents()` - All agents in system
- `fetchAgentsForFilter()` - Agents with tickets
- `fetchGraders()` - QA graders
- `fetchAgentIssues()` - Agent's unresolved issues
- `fetchTickets()` - Tickets with filters
- `fetchPendingMacroTickets()` - Incoming macro tickets
- `fetchAssignments()` - Agent assignments

#### Agent CRUD
- `handleCreateAgent()`
- `handleUpdateAgent()`
- `handleDeleteAgent()`
- `handleAddExistingAgent()`
- `handleConfirmSimilarAgent()`

#### Ticket CRUD
- `handleCreateTicket()`
- `handleUpdateTicket()`
- `handleDeleteTicket()`
- `handleArchiveTicket()`
- `handleRestoreTicket()`
- `handleBulkArchive()`
- `handleArchiveAll()`
- `handleGradeTicket()`
- `handleUpdateFeedback()`

#### Navigation/Dialog
- `openTicketDialog()` - Open ticket modal
- `navigateToTicket()` - Navigate prev/next ticket
- `navigateWithUnsavedCheck()` - Navigate with unsaved check
- `handleViewAgentTickets()` - View agent's tickets
- `handleAgentExpand()` - Expand agent issues

#### Export/Import
- `handleExportMaestro()` - Export to MaestroQA
- `handleExportSelectedTickets()` - Export selected
- `handleStartGrading()` - Start Chrome extension grading

#### Macro Tickets
- `handleSendMacroTicket()` - Send ticket to grader
- `handleAcceptMacroTicket()` - Accept incoming ticket
- `handleDeclineMacroTicket()` - Decline incoming ticket

#### Validation
- `validateTicketForGrading()` - Validate single ticket
- `validateGradingPrerequisites()` - Validate all before grading
- `clearValidationErrors()` - Clear validation state

#### Utility
- `getSortedData()` - Sort data by config
- `handleSort()` - Update sort config

---

### RENDER FUNKCIJE
- `renderDashboard()` - Dashboard tab content (~200 lines)
- `renderAgents()` - Agents tab content (~300 lines)
- `renderTickets()` - Tickets tab content (~350 lines)
- `renderArchive()` - Archive tab content (~350 lines)

### DIALOG KOMPONENTE (defined inside QAManager)
- `LoadingSkeleton` - Loading state
- `StatCard` - Dashboard stat card
- `QualityScoreBadge` - Score badge
- `EmptyState` - Empty state display
- `AgentDialogContent` - Agent form dialog
- `AddExistingAgentDialog` - Add existing agent
- `SimilarAgentDialog` - Similar agent confirmation
- `TicketDialogContent` - Ticket form dialog (~400 lines)
- `GradeDialogContent` - Grade dialog
- `FeedbackDialogContent` - Feedback dialog
- `ViewTicketDialogContent` - View ticket dialog (~200 lines)
- `DeleteDialogContent` - Delete confirmation
- `PaginationComponent` - Pagination controls

---

## PLAN IMPLEMENTACIJE

### FAZA 1: Kreiranje QAManagerContext
**Fajl:** `src/context/QAManagerContext.jsx`

Context će sadržati:
- Sav deljeni state (agents, tickets, filters, dialogs)
- Sve API funkcije
- Sve CRUD funkcije
- Utility funkcije

```jsx
const QAManagerContext = createContext();

export const QAManagerProvider = ({ children }) => {
  // State
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);
  // ... sav ostali state

  // Functions
  const fetchAgents = async () => { ... };
  const handleCreateTicket = async () => { ... };
  // ... sve ostale funkcije

  return (
    <QAManagerContext.Provider value={{
      // State
      agents, tickets, loading, ...
      // Functions
      fetchAgents, handleCreateTicket, ...
    }}>
      {children}
    </QAManagerContext.Provider>
  );
};

export const useQAManager = () => useContext(QAManagerContext);
```

### FAZA 2: Kreiranje QAManagerLayout
**Fajl:** `src/pages/qa-manager/QAManagerLayout.jsx`

Layout sadrži:
- Header sa naslovom
- Tabs navigacija (koristi `useNavigate` umesto `setActiveTab`)
- `<Outlet />` za child rute
- Globalni dialozi (koji se mogu otvoriti sa bilo kog taba)

```jsx
const QAManagerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = getTabFromPath(location.pathname);

  return (
    <QAManagerProvider>
      <div className="qa-manager-layout">
        <Header />
        <Tabs value={activeTab} onValueChange={(tab) => navigate(`/qa-manager/${tab}`)}>
          <TabsList>...</TabsList>
        </Tabs>
        <Outlet />
        <GlobalDialogs />
        <BugReportButton />
      </div>
    </QAManagerProvider>
  );
};
```

### FAZA 3: Izdvajanje Tab Komponenti

#### `src/pages/qa-manager/QADashboard.jsx`
- Koristi `useQAManager()` za state i funkcije
- Sadrži `renderDashboard()` logiku
- Fetchuje `dashboardStats` on mount

#### `src/pages/qa-manager/QAAgents.jsx`
- Koristi `useQAManager()` za state i funkcije
- Sadrži `renderAgents()` logiku
- Lokalni state: `expandedAgentId`, `agentIssues`

#### `src/pages/qa-manager/QATickets.jsx`
- Koristi `useQAManager()` za state i funkcije
- Sadrži `renderTickets()` logiku
- Lokalni state: `focusedTicketIndex`, `selectedTickets`, `sortConfig`

#### `src/pages/qa-manager/QAArchive.jsx`
- Slično kao QATickets ali za archived tickets
- Koristi `archiveFilters` umesto `ticketsFilters`

### FAZA 4: Ažuriranje App.js Ruta

```jsx
<Route path="/qa-manager" element={<QAManagerLayout />}>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<QADashboard />} />
  <Route path="agents" element={<QAAgents />} />
  <Route path="tickets" element={<QATickets />} />
  <Route path="tickets/:ticketId" element={<QATicketView />} />
  <Route path="tickets/:ticketId/edit" element={<QATicketEdit />} />
  <Route path="archive" element={<QAArchive />} />
  <Route path="analytics" element={<QAAnalyticsDashboard />} />
  <Route path="summaries" element={<QASummaries />} />
  <Route path="import" element={<QAImportTickets />} />
  <Route path="all-agents" element={<ProtectedAdminRoute><QAAllAgents /></ProtectedAdminRoute>} />
  <Route path="statistics" element={<ProtectedAdminRoute><StatisticsPage /></ProtectedAdminRoute>} />
  <Route path="active-overview" element={<ProtectedAdminRoute><QAActiveOverview /></ProtectedAdminRoute>} />
  <Route path="bugs" element={<ProtectedAdminRoute><BugReportsAdmin /></ProtectedAdminRoute>} />
</Route>
```

### FAZA 5: Ažuriranje WheelNavigation

```jsx
// STARO:
{ path: '/qa-manager?tab=dashboard' }

// NOVO:
{ path: '/qa-manager/dashboard' }
```

---

## STRUKTURA FAJLOVA POSLE REFAKTORA

```
src/
├── context/
│   └── QAManagerContext.jsx          # NEW - Deljeni state i funkcije
├── pages/
│   └── qa-manager/
│       ├── index.js                   # NEW - Export barrel
│       ├── QAManagerLayout.jsx        # NEW - Layout sa tabs i Outlet
│       ├── QADashboard.jsx            # NEW - Dashboard tab
│       ├── QAAgents.jsx               # NEW - Agents tab
│       ├── QATickets.jsx              # NEW - Tickets tab
│       ├── QATicketView.jsx           # NEW - View single ticket
│       ├── QATicketEdit.jsx           # NEW - Edit single ticket
│       ├── QAArchive.jsx              # NEW - Archive tab
│       └── components/                # NEW - Shared components
│           ├── StatCard.jsx
│           ├── QualityScoreBadge.jsx
│           ├── EmptyState.jsx
│           ├── LoadingSkeleton.jsx
│           ├── PaginationComponent.jsx
│           ├── AgentDialogContent.jsx
│           ├── TicketDialogContent.jsx
│           ├── ViewTicketDialogContent.jsx
│           ├── GradeDialogContent.jsx
│           ├── FeedbackDialogContent.jsx
│           └── DeleteDialogContent.jsx
└── components/
    └── WheelNavigation.jsx            # UPDATE - Nove putanje
```

---

## POTENCIJALNI PROBLEMI I REŠENJA

### Problem 1: State Sync između tabova
**Rizik:** Tickets tab modifikuje ticket, ali Archive ne vidi promenu
**Rešenje:** Context drži sve tickets i ažurira se centralno

### Problem 2: Dialog state i URL
**Rizik:** Dialozi se otvaraju preko state-a, ne preko URL-a
**Rešenje:** Zadržati dialoge kao state-based, ali URL za ticket view/edit

### Problem 3: Keyboard shortcuts
**Rizik:** Alt+1/2/3/4 za tab navigaciju
**Rešenje:** Koristiti `navigate()` umesto `setActiveTab()`

### Problem 4: Validation errors across tabs
**Rizik:** Validation error setta u Tickets, ali treba da ode na Agents
**Rešenje:** Context drži validation state, `navigate()` za tab switch

### Problem 5: Large bundle size
**Rizik:** Sve komponente se učitavaju odjednom
**Rešenje:** React.lazy() za child rute

---

## REDOSLED IMPLEMENTACIJE

1. ✅ Analiza i dokumentacija
2. ⏳ Kreirati `QAManagerContext.jsx`
3. ⏳ Kreirati `QAManagerLayout.jsx`
4. ⏳ Izdvojiti helper komponente (StatCard, etc.)
5. ⏳ Izdvojiti dialog komponente
6. ⏳ Kreirati `QADashboard.jsx`
7. ⏳ Kreirati `QAAgents.jsx`
8. ⏳ Kreirati `QATickets.jsx`
9. ⏳ Kreirati `QAArchive.jsx`
10. ⏳ Ažurirati `App.js` rute
11. ⏳ Ažurirati `WheelNavigation.jsx`
12. ⏳ Testiranje svih ruta
13. ⏳ Cleanup starog `QAManager.jsx`

---

## OČUVANJE PODATAKA

### Ovo se NE MENJA:
- Backend API endpointi
- MongoDB modeli
- Logika CRUD operacija
- Validacija
- Authentication/Authorization

### Ovo se MENJA:
- Struktura frontend komponenti
- Navigacija (URL umesto state)
- Organizacija koda

**PODACI SU SIGURNI** - refaktor je isključivo frontend strukturalni.

---

## ROLLBACK PLAN

Ako nešto pođe po zlu:
```bash
git checkout <commit-before-refactor>
```

Preporučujem commit posle svake faze za lakši rollback.
