# QA Manager - Ideje za Poboljšanja

## 1. AGENTS STRANICA

### 1.1 Quick Add Multiple Agents (Visok prioritet)
- Bulk dodavanje agenata - tekstualno polje gde se kopira lista agenata (jedan po liniji)
- Sistem automatski pronalazi matching agente iz baze
- Checkbox za sve i potvrda jednim klikom

### 1.2 Agent Templates / Presets
- Sačuvaj "preset" za česte kombinacije agenata
- Npr. "Monday Team", "Friday Team"
- Jednim klikom učitaj preset za nedelju

### 1.3 Agent History View ✅ IMPLEMENTED
- Dugme "History" pored svakog agenta
- Performance trend (prosečan score kroz vreme) sa trend indikatorom (↑↓→)
- Weekly breakdown za poslednje 3 nedelje (ne računajući trenutnu)
- Lista tiketa grupirana po nedeljama (collapse/expand)
- Score badge za svaki tiket sa kategorijama
- Top 5 najčešćih kategorija
- Copy ticket ID na klik
- Side panel dizajn sa ESC za zatvaranje

### 1.4 Drag & Drop Reordering
- Ručno sortiranje agenata po prioritetu
- Redosled se pamti lokalno

### 1.5 "Copy Week" funkcionalnost
- Kopiraj sve agente iz prošle nedelje u trenutnu

---

## 2. TICKETS STRANICA

### 2.1 Keyboard Shortcuts Panel (Visok prioritet)
- `Ctrl+N` - New Ticket
- `Ctrl+S` - Save (u edit modu)
- `Ctrl+Enter` - Save and Next
- `Alt+←/→` - Prethodni/Sledeći tiket
- `Ctrl+E` - Edit selektovanog tiketa
- `Ctrl+A` - Archive selektovanog tiketa

### 2.2 Quick Grading Mode (Visok prioritet)
- Kompaktniji prikaz tiketa (card umesto full-screen dialog)
- Scorecard i feedback vidljivi odmah
- Auto-navigate na sledeći tiket nakon save

### 2.3 Auto-populate from Intercom
- Automatski povuci notes/transcript iz Intercom tiketa
- Pre-fill kategoriju na osnovu sadržaja (AI classification)

### 2.4 Duplicate Ticket Detection
- Upozorenje ako tiket sa istim ID-jem već postoji
- Opcija "View Existing" za brzu navigaciju

### 2.5 Smart Category Suggestions
- Na osnovu notes sadržaja, sugeriši kategorije
- "Suggested: VIP program, Rakeback" ispod categories polja

### 2.6 Batch Status Change
- Selektuj više tiketa
- Promeni status svima odjednom

### 2.7 Quick Note Templates
- Pre-definisani šabloni za Notes polje
- Npr. "Agent nije pratio SOP za...", "Dobar handling kompleksnog pitanja..."

### 2.8 Ticket Comparison View
- Side-by-side prikaz dva tiketa istog agenta
- Korisno za konzistentnost ocenjivanja

---

## 3. ARCHIVE STRANICA

### 3.1 Export Search Results
- Dugme "Export" za trenutne rezultate pretrage
- CSV/Excel format

### 3.2 Advanced AI Search Filters
- Filter po relevance score (samo >70% match)
- Filter po grader-u
- Filter po vremenskom periodu

### 3.3 "Find Similar" One-Click
- Dugme na svakom tiketu koje pokreće AI search sa tim feedback-om

### 3.4 Statistics Dashboard
- Ukupno arhiviranih tiketa
- Prosečan score po kategoriji
- Top 5 najčešćih kategorija

---

## 4. SUMMARIES STRANICA

### 4.1 Template Customization
- Customize format summary-ja
- Različiti template-ovi: "Detailed", "Brief", "For Manager"

### 4.2 Auto-Schedule Summary Generation
- Automatski generiši summary na kraju smene
- Notifikacija/reminder

### 4.3 Compare Summaries
- Uporedi dva summary-ja (npr. ova i prošla nedelja)

### 4.4 Share to Slack/Teams Integration
- Direktan share summary-ja u team channel

### 4.5 Weekly Summary Aggregation
- Automatski kombinuj daily summaries u weekly overview

### 4.6 All Summaries View ✅ IMPLEMENTED
- Prikaz svih summary-ja od svih QA agenata
- Sortiranje po datumu i smeni (Morning pre Afternoon za isti datum)
- Filter po smeni (All/Morning/Afternoon)
- Grupiranje po datumu sa sticky header-ima
- Load more pagination

---

## 5. GLOBALNE FUNKCIONALNOSTI

### 5.1 Global Command Palette (Visok prioritet)
- `Ctrl+K` ili `Ctrl+P` za otvaranje
- Brza navigacija i akcije
- Pretraga svega: agenata, tiketa, macros-a

### 5.2 Notification Center
- Obaveštenja o pending macro tickets
- Reminder za nezavršene tikete
- Alert kada agent ima loš trend

### 5.3 Quick Stats Bar
- Fiksiran mini-bar na vrhu
- Broj tiketa danas: Selected / Graded
- Pending macro tickets count

### 5.4 Undo/Redo for Recent Actions
- "Undo Archive" za slučajno arhiviranje
- Toast notification sa "Undo" dugmetom

### 5.5 Activity Log
- Log svih akcija korisnika
- "Recently Viewed Tickets"
- "Recently Edited Agents"

---

## 6. WORKFLOW AUTOMATIZACIJE

### 6.1 Auto-Archive Rules
- Automatski arhiviraj tikete starije od X dana ako su Graded

### 6.2 Smart Agent Suggestions for New Ticket
- Sugeriši agenta na osnovu poslednjeg korišćenog ili pattern-a

### 6.3 Grading Workflow Wizard
- Step-by-step wizard za nove QA agente

### 6.4 Batch Import Tickets
- Import lista ticket ID-jeva iz CSV/Excel

---

## 7. AI POBOLJŠANJA

### 7.1 AI Feedback Generator
- Na osnovu scorecard ocena i kategorije generiši feedback

### 7.2 AI Trend Analysis
- Automatska analiza agenata sa padajućim scorom
- Preporuke za fokus oblasti

### 7.3 Smart Duplicate Detection
- AI pronalazi tikete o istom problemu

### 7.4 Contextual AI Suggestions
- Real-time sugestije dok pišeš feedback

---

## 8. REPORTING & ANALYTICS

### 8.1 Personal Dashboard
- Lični statistici (koliko tiketa ovaj mesec)
- Performance trend

### 8.2 Team Leaderboard
- Uporedna statistika QA agenata

### 8.3 Agent Performance Reports
- Detaljni izveštaji po agentu
- Exportable PDF/Excel

### 8.4 Category Analysis
- Koje kategorije su najčešće
- Prosečan score po kategoriji

---

## 9. UX POBOLJŠANJA

### 9.1 Sticky Action Bar
- Sticky bar na dnu ekrana kada su tiketi selektovani

### 9.2 Quick View Hover ✅ IMPLEMENTED
- Hover preko ticket ID → mini preview
- Side card mode i bottom dock mode

### 9.3 Remember Last Filters
- Pamti poslednje korišćene filtere po stranici

### 9.4 Collapsible Sidebar
- Smanji sidebar za više prostora

### 9.5 Breadcrumb Navigation
- Jasna navigacija: QA Manager > Tickets > Edit #12345

---

## PRIORITETNA LISTA (Top 10)

| # | Feature | Status |
|---|---------|--------|
| 1 | Quick Grading Mode | Pending |
| 2 | Keyboard Shortcuts Panel | Pending |
| 3 | Global Command Palette | Pending |
| 4 | Copy Previous Week Agents | Pending |
| 5 | AI Feedback Generator | Pending |
| 6 | Batch Import Tickets | Pending |
| 7 | Quick Stats Bar | Pending |
| 8 | Undo Recent Actions | Pending |
| 9 | Export Search Results | Pending |
| 10 | Agent Performance History | Pending |

---

## IMPLEMENTIRANO

- [x] Quick View Hover (Ticket preview on hover)
- [x] Image Lightbox fix (ESC, click outside, X button)
- [x] Copy/Paste images between Notes and Feedback
- [x] All Summaries view
