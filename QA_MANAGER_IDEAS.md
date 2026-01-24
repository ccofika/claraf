# QA Manager - Feature Ideas

## IMPLEMENTIRANO

- [x] **Quick View Hover** - Ticket preview on hover (side card + bottom dock mode)
- [x] **Image Lightbox** - ESC, click outside, X button za zatvaranje
- [x] **Copy/Paste images** - Između Notes i Feedback polja
- [x] **All Summaries View** - Svi summary-ji svih gradera, filteri, sidebar navigacija
- [x] **Agent History View** - Performance trend, weekly breakdown, ticket preview panel

---

## 1. GRADER ANALYTICS & OVERSIGHT

### 1.1 Grader Performance Dashboard

**Problem:** Sa 18+ aktivnih gradera, QA lead nema centralizovan uvid u to kako svaki grader radi. Pregled na MaestroQA je ograničen.

**Rešenje:** Dedicirani dashboard za analizu gradera.

**Funkcionalnosti:**
- **Per-grader statistika:**
  - Broj ocenjenih tiketa (danas, ova nedelja, ovaj mesec)
  - Prosečan score koji daje
  - Distribucija ocena (histogram: koliko 90+, koliko 80-89, koliko <80)
  - Najčešće kategorije koje ocenjuje
  - Vreme provedeno (ako se trackuje)

- **Trend analiza:**
  - Da li grader postaje blaži ili stroži tokom vremena?
  - Graf prosečnog score-a po nedelji
  - Uporedba sa team prosekom

- **Scorecard pattern analiza:**
  - Koje scorecard vrednosti grader najčešće markira kao "needs improvement"?
  - Da li grader konzistentno daje niže ocene za "Communication" nego ostali?
  - Heatmap: scorecard vrednosti × grader

- **Comparison mode:**
  - Side-by-side dva gradera
  - Isti agenti/kategorije, različiti rezultati?
  - Identifikacija outlier-a

**UI koncept:**
- Zasebna stranica ili tab unutar postojećeg Admin područja
- Dropdown za selekciju gradera
- Date range picker
- Exportable reports (PDF/Excel)

---

### 1.2 Cross-Grader Consistency Report

**Problem:** Različiti graderi mogu oceniti istu vrstu greške različito. Nema sistema koji to detektuje.

**Rešenje:** Automatski report koji identifikuje nekonzistentnosti.

**Kako radi:**
1. Sistem analizira tikete gde je **isti agent** ocenjen od **različitih gradera**
2. Poredi score-ove za iste kategorije
3. Flaguje značajne razlike (npr. >15% razlika u score-u za istu kategoriju)
4. Generiše weekly/monthly report

**Primer outputa:**
```
Agent: John Smith
Kategorija: VIP Program

Grader A: 85% (3 tiketa)
Grader B: 72% (2 tiketa)
Razlika: 13% - FLAGGED

Preporuka: Review tikete oba gradera za ovu kombinaciju
```

**Dodatno:**
- Link do konkretnih tiketa za review
- Trend: da li se konzistentnost poboljšava?
- "Calibration score" za svakog gradera

---

### 1.3 Real-Time Team Activity Feed

**Problem:** QA lead ne zna šta se dešava u realnom vremenu. Ko radi, ko ne radi, šta se ocenjuje?

**Rešenje:** Live feed aktivnosti tima.

**Prikazuje:**
- Ko je trenutno aktivan (poslednja aktivnost <15 min)
- Poslednje ocenjeni tiketi (live stream)
- Alerts za neobične pattern-e:
  - Grader dao 5 tiketa sa score <70% u nizu
  - Grader nije aktivan već 2+ sata (tokom radnog vremena)
  - Nagla promena u prosečnom score-u

**UI:**
- Compact widget na Dashboard-u
- Ili dedicirana "Team Activity" stranica
- Filterable by grader

---

### 1.4 Weekly Team Digest (Auto-Generated)

**Problem:** Nema automatizovanog pregleda rada tima. Lead mora ručno da sastavlja.

**Rešenje:** Sistem automatski generiše nedeljni izveštaj.

**Sadržaj:**
```
WEEKLY QA DIGEST - Week 3, 2025

TEAM SUMMARY
- Total tickets graded: 847
- Average score: 84.2%
- Most active day: Wednesday (203 tickets)

TOP PERFORMERS (Graders)
1. Ana M. - 89 tickets, avg 86.1%
2. Marko S. - 76 tickets, avg 83.4%
...

AGENTS NEEDING ATTENTION
1. Agent X - Score dropped 12% vs last week
2. Agent Y - 3 tickets <70% this week

CONSISTENCY METRICS
- Team score variance: 8.2% (target: <10%)
- Scorecard alignment: 76% (target: >80%)

CATEGORY BREAKDOWN
- VIP Program: 124 tickets, avg 82%
- Crypto Withdrawals: 98 tickets, avg 79%
...
```

**Delivery:**
- In-app notifikacija ponedeljkom ujutru
- Opciono: email digest
- Exportable PDF

---

## 2. SCORECARD INTELLIGENCE

### 2.1 Scorecard Insights Panel (Per-Agent)

**Problem:** Agent History pokazuje overall score i trend, ali ne pokazuje ZAŠTO agent ima probleme. Koji specifični aspekti performansi su loši?

**Rešenje:** Dublja analiza scorecard podataka po agentu.

**Prikazuje:**
- **Scorecard Value Breakdown:**
  - Opening Message: 92% prosek (dobro)
  - Communication: 71% prosek (problem!)
  - Knowledge: 68% prosek (veliki problem!)
  - ...

- **Trend po vrednosti:**
  - Communication: ↑ poboljšava se (bio 65%, sad 71%)
  - Knowledge: → stabilno (oko 68%)
  - Efficiency: ↓ pogoršava se (bio 85%, sad 78%)

- **Visual heatmap:**
  - Nedeljni grid gde boje pokazuju performance po svakoj vrednosti

**Integracija:**
- Deo Agent History View panela
- Ili zasebni tab unutar Agent detalja

---

### 2.2 Category-Scorecard Correlation

**Problem:** Neke kategorije možda inherentno rezultuju nižim ocenama za određene scorecard vrednosti. To nije nužno graderova greška.

**Rešenje:** Analiza koja pokazuje očekivane scorecard vrednosti po kategoriji.

**Primer:**
```
Kategorija: "Crypto Withdrawals"
Expected scorecard patterns:
- Knowledge: Usually lower (complex topic) - team avg: 72%
- Process: Usually lower (many steps) - team avg: 75%
- Communication: Normal range - team avg: 84%

When grading this category, scores 10-15% below average
for Knowledge/Process are within normal range.
```

**Korist:**
- Grader zna šta da očekuje
- Lead zna da niži score nije nužno graderova greška
- Objektivniji benchmarking

---

### 2.3 Scorecard Calibration Tool

**Problem:** 18 gradera može različito interpretirati scorecard vrednosti. Šta je "Good" za jednog može biti "Needs Improvement" za drugog.

**Rešenje:** Kalibracioni alat sa referentnim primerima.

**Kako radi:**
1. **Reference Library:** Kolekcija tiketa sa "zlatnim standardom" ocenama
   - Za svaku scorecard vrednost: primeri za svaki nivo (Best, Good, Coach, Improve)
   - Sa objašnjenjem zašto je to taj nivo

2. **Blind Calibration Test:**
   - Grader ocenjuje referentne tikete bez da vidi "pravu" ocenu
   - Sistem poredi sa referentnom ocenom
   - Pokazuje gde grader divergira

3. **Calibration Score:**
   - Svaki grader ima calibration score (% poklapanja sa referencom)
   - Trackuje se tokom vremena
   - Alert ako score padne ispod praga

**UI:**
- Posebna sekcija "Calibration Center"
- Možda gamifikacija (badges, leaderboard)

---

## 3. WORKFLOW OPTIMIZATION

### 3.1 Grading Session Mode

**Problem:** Grading 10-30 tiketa dnevno može biti monoton. Nema "fokus" moda, nema progress tracking.

**Rešenje:** Dedicated session mode za batch grading.

**Funkcionalnosti:**
- **Start Session:**
  - Izaberi tikete za sesiju (po agentu, kategoriji, ili ručno)
  - Set goal: "Grade 15 tickets"

- **Session View:**
  - Distraction-free interface
  - Progress bar: 5/15 done
  - Quick navigation: Previous | Current | Next
  - Session timer (optional)
  - Keyboard-first navigation

- **Session End:**
  - Summary: 15 tickets, avg score 82%, 45 minutes
  - Categories covered
  - Option to continue or end

**Dodatno:**
- "Focus mode" - sakriva sidebar, notifications
- Streak counter (5 in a row!)
- Break reminders

---

### 3.2 Smart Ticket Queue

**Problem:** Tiketi se prikazuju nasumično ili po datumu. Nema inteligentnog redosleda.

**Rešenje:** AI/rule-based prioritizacija tiketa.

**Queue strategije:**
1. **By Agent:** Grupiši sve tikete istog agenta zajedno
   - Benefit: Kontekst se održava, brže ocenjivanje

2. **By Category:** Grupiši po kategoriji
   - Benefit: Konzistentnije ocenjivanje iste vrste problema

3. **By Priority:** Critical/High priority first
   - Benefit: Važni tiketi se ne propuštaju

4. **Balanced:** Rotiraj agente i kategorije
   - Benefit: Sprečava "zamor" od istog agenta

5. **Smart Mix:** Kombinacija bazirana na:
   - Agent koji dugo nije ocenjivan
   - Kategorije koje grader manje pokriva
   - Tiketi bliži deadline-u (ako postoji)

**UI:**
- Queue selector na Tickets stranici
- Preview: "Next 10 tickets in queue"
- Drag-drop reorder (manual override)

---

### 3.3 Keyboard Power User Mode

**Problem:** Previše klikova za uobičajene akcije. Mouse-heavy workflow.

**Rešenje:** Comprehensive keyboard shortcuts + visual mode.

**Shortcuts (konfigurisani):**
```
GLOBAL
Ctrl+K          Command Palette
Alt+1/2/3/4     Switch tabs (Dashboard/Tickets/Agents/Archive)
Ctrl+N          New Ticket
Ctrl+F          Focus search
Esc             Close modal/Cancel

TICKETS LIST
J/K             Navigate up/down
Enter           Open selected ticket
E               Edit selected
A               Archive selected
I               Open in Intercom
Space           Toggle selection

TICKET DIALOG
Tab             Next field
Shift+Tab       Previous field
Ctrl+Enter      Save
Ctrl+Shift+Enter Save and Next
1-5             Set scorecard value (when focused)
Ctrl+S          Save draft
```

**Visual mode:**
- Press `?` to show shortcut overlay
- Shortcut hints on buttons (subtle)
- "Vim mode" option for power users

---

### 3.4 Ticket Templates

**Problem:** Neki tipovi tiketa imaju predvidljiv sadržaj. Ručno popunjavanje je repetitivno.

**Rešenje:** Saveable ticket templates.

**Funkcionalnosti:**
- **Create Template:**
  - Pre-fill: Categories, Notes template, Feedback template
  - Partial scorecard (common values pre-set)

- **Use Template:**
  - "New from Template" dropdown
  - Template se primeni, grader samo dopuni specifičnosti

**Primeri template-a:**
- "Standard Good Performance" - 90%+ score, positive feedback skeleton
- "VIP Complaint Handling" - VIP kategorija, specific scorecard focus
- "Technical Issue" - Tech categories pre-selected

---

## 4. AGENT COACHING & DEVELOPMENT

### 4.1 Agent Coaching Report Generator

**Problem:** QA lead treba da pripremi coaching materijal za agente. Ručno sakupljanje podataka.

**Rešenje:** One-click comprehensive coaching report.

**Report sadržaj:**
```
COACHING REPORT: Agent Name
Period: Last 4 weeks
Generated: January 23, 2025

PERFORMANCE SUMMARY
- Total tickets reviewed: 23
- Average score: 76.4%
- Trend: ↓ Declining (-4.2% vs previous period)

SCORECARD ANALYSIS
Strengths:
✓ Opening Message: 94% (Excellent)
✓ Response Time: 91% (Excellent)

Areas for Improvement:
✗ Knowledge: 62% (Needs significant improvement)
✗ Process: 68% (Below target)

SPECIFIC EXAMPLES
Issue: Knowledge gaps in Crypto Withdrawals
- Ticket #12345 (Jan 15): Score 58%
  "Agent provided incorrect information about..."
- Ticket #12367 (Jan 18): Score 64%
  "Follow-up showed same knowledge gap..."

RECOMMENDED FOCUS AREAS
1. Crypto withdrawal process (3 incidents)
2. VIP program benefits (2 incidents)

SUGGESTED ACTIONS
- Review training materials for Crypto section
- Shadow senior agent for VIP handling
- Schedule follow-up review in 2 weeks
```

**Export:** PDF za coaching session, shareable sa agent-om

---

### 4.2 Agent Risk Scoring

**Problem:** Sa puno agenata, teško je znati koji trebaju hitnu pažnju.

**Rešenje:** Automatski risk score za svakog agenta.

**Risk faktori:**
- Recent scores below threshold
- Declining trend (week over week)
- Repeated issues in same category
- Multiple low scorecard values
- Long time since last good score

**Risk levels:**
- 🟢 Low Risk (score 0-30): Agent performing well
- 🟡 Medium Risk (score 31-60): Some concerns, monitor
- 🔴 High Risk (score 61-100): Needs immediate attention

**Dashboard widget:**
- List of high-risk agents
- Quick link to their history
- "Snooze" option (reviewed, monitoring)

---

### 4.3 Agent Comparison View

**Problem:** Teško uporediti dva agenta direktno.

**Rešenje:** Side-by-side comparison tool.

**Features:**
- Select two agents
- Compare:
  - Overall scores (trend charts overlaid)
  - Scorecard values (radar chart)
  - Common categories
  - Volume of tickets

**Use cases:**
- Comparing similar-role agents
- Before/after training comparison (same agent, different periods)
- Identifying what makes top performers different

---

## 5. DATA & ANALYTICS

### 5.1 Category Deep Dive

**Problem:** Neke kategorije možda imaju sistemske probleme. Teško videti big picture.

**Rešenje:** Per-category analytics page.

**Za svaku kategoriju:**
- Total tickets all time / this month / this week
- Average score (with trend)
- Distribution across agents
- Common scorecard issues for this category
- Top graders for this category
- Comparison vs other categories

**Insight primeri:**
- "VIP Program" has 15% lower avg score than other categories
- "Crypto Withdrawals" is graded by only 3 graders (concentration risk)
- "Account Recovery" scores improving month-over-month

---

### 5.2 Time-Based Analysis

**Problem:** Da li postoje patterns based on time? Day of week, time of day?

**Rešenje:** Temporal analytics.

**Analize:**
- **Day of week patterns:**
  - Monday tickets have lower scores (agents tired after weekend?)
  - Friday afternoon: faster grading, same quality?

- **Monthly trends:**
  - Score trends over months
  - Volume trends

- **Seasonality:**
  - Holiday periods: different patterns?

---

### 5.3 Export & Integration Hub

**Problem:** Data locked in Clara. Teško izvući za eksterne analize.

**Rešenje:** Comprehensive export capabilities.

**Export options:**
- **Quick Export:** Current view → Excel/CSV
- **Custom Report Builder:**
  - Select fields
  - Select date range
  - Select agents/graders/categories
  - Schedule recurring exports

- **API Access:** (za napredne korisnike)
  - Endpoints za programmatic access
  - Webhook notifications

---

## 6. MACRO SYSTEM ENHANCEMENTS

### 6.1 Macro Analytics Dashboard

**Problem:** Macros se koriste za konzistentnost, ali nema uvida u njihovu upotrebu.

**Rešenje:** Analytics za macro usage.

**Metrike:**
- Most used macros (overall, this week)
- Macro usage by grader (ko koristi šta)
- Macro usage by category (koji macro za koju kategoriju)
- Macro effectiveness:
  - Average score of tickets using Macro X
  - Do tickets with macros have better/worse outcomes?

**Insights:**
- "Macro 'VIP Explanation' used 47 times this week, avg score 84%"
- "Grader A uses macros 80% of time, Grader B only 20%"
- "Category 'Crypto' rarely uses macros - opportunity?"

---

### 6.2 Macro Suggestions

**Problem:** Grader možda ne zna da postoji relevantan macro.

**Rešenje:** Smart macro suggestions tokom grading-a.

**Kako radi:**
1. Grader selektuje kategoriju
2. Sistem sugeriše: "Commonly used macros for this category:"
   - Macro A (used 34 times)
   - Macro B (used 12 times)
3. One-click insert

**Dodatno:**
- "Your frequently used macros"
- "Team favorites"

---

## 7. UX IMPROVEMENTS

### 7.1 Customizable Dashboard

**Problem:** Dashboard je isti za sve. Različiti korisnici imaju različite prioritete.

**Rešenje:** Widget-based customizable dashboard.

**Widgets available:**
- My tickets today
- Team activity feed
- Agent risk alerts
- Quick stats
- Recent grading history
- Category breakdown
- Grader leaderboard (for leads)

**Customization:**
- Drag-drop widget arrangement
- Show/hide widgets
- Resize widgets
- Save layout

---

### 7.2 Dark Mode Improvements

**Problem:** Ako postoji dark mode, možda nije potpun.

**Rešenje:** Full dark mode support across all components.

---

### 7.3 Mobile Responsive View

**Problem:** App nije optimizovan za mobile/tablet.

**Rešenje:** Responsive design za osnovne funkcije.

**Mobile priorities:**
- View tickets list
- Quick grade (simplified)
- View agent stats
- Approve/reject macro tickets

---

### 7.4 Notification System

**Problem:** Korisnik ne zna kada se nešto desi (pending tickets, mentions, etc).

**Rešenje:** In-app notification center.

**Notifikacije:**
- Pending macro tickets
- Agent risk alerts
- Weekly digest ready
- Calibration reminder
- System announcements

**UI:**
- Bell icon u header-u
- Badge count
- Dropdown sa recent notifications
- Mark as read

---

## PRIORITETNA LISTA

| # | Feature | Kategorija | Kompleksnost | Impact |
|---|---------|-----------|--------------|--------|
| 1 | Grader Performance Dashboard | Oversight | High | High |
| 2 | Grading Session Mode | Workflow | Medium | High |
| 3 | Agent Coaching Report Generator | Coaching | Medium | High |
| 4 | Scorecard Insights Panel | Intelligence | Medium | Medium |
| 5 | Keyboard Power User Mode | UX | Medium | Medium |
| 6 | Weekly Team Digest | Oversight | Medium | Medium |
| 7 | Cross-Grader Consistency Report | Oversight | High | High |
| 8 | Smart Ticket Queue | Workflow | Medium | Medium |
| 9 | Agent Risk Scoring | Coaching | Low | Medium |
| 10 | Macro Analytics Dashboard | Intelligence | Low | Low |

---

*Dokument se ažurira na osnovu implementacija i feedback-a.*
