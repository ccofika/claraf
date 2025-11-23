# Share to Chat - Usage Guide

## Overview
ShareButton komponenta omogućava slanje workspace elemenata i QA tiketa direktno u chat konverzacije.

## Komponente

### 1. ShareButton
Glavni button koji otvara modal za odabir chat-a.

### 2. ShareToChatModal
Modal koji prikazuje listu dostupnih chat-ova i omogućava slanje.

## Kako koristiti

### Za Workspace Elemente

1. **Importuj komponentu:**
```jsx
import ShareButton from '../components/Chat/ShareButton';
```

2. **Dodaj button u UI (npr. u element toolbar ili context menu):**

#### Primer 1: Button variant
```jsx
<ShareButton
  item={{
    _id: element._id,
    workspaceId: workspace._id,
    workspaceName: workspace.name,
    type: element.type,
    title: element.content || 'Untitled',
    content: element.content,
  }}
  type="element"
  variant="button"
/>
```

#### Primer 2: Icon variant (za toolbar)
```jsx
<ShareButton
  item={{
    _id: element._id,
    workspaceId: workspace._id,
    workspaceName: workspace.name,
    type: element.type,
    title: element.content || 'Untitled',
    content: element.content,
  }}
  type="element"
  variant="icon"
/>
```

### Za QA Tikete

1. **Importuj komponentu:**
```jsx
import ShareButton from '../components/Chat/ShareButton';
```

2. **Dodaj button u UI (npr. u ticket toolbar ili context menu):**

#### Primer 1: Button variant
```jsx
<ShareButton
  item={{
    _id: ticket._id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category
  }}
  type="ticket"
  variant="button"
/>
```

#### Primer 2: Icon variant
```jsx
<ShareButton
  item={{
    _id: ticket._id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category
  }}
  type="ticket"
  variant="icon"
/>
```

## Gde dodati ShareButton

### Workspace Elementi

**Opcija 1: Context Menu**
Dodaj u kontekstni meni koji se pojavljuje kada klikneš desnim klikom na element.

**Opcija 2: Element Toolbar**
Dodaj u toolbar koji se pojavljuje kada je element selektovan.

**Opcija 3: Dropdown Menu**
Dodaj u dropdown meni sa opcijama (npr. pored Delete, Duplicate, itd.)

Primer pozicije u Canvas toolbar-u:
```jsx
<div className="toolbar">
  <button onClick={handleDelete}>Delete</button>
  <button onClick={handleDuplicate}>Duplicate</button>
  <ShareButton item={selectedElement} type="element" variant="icon" />
</div>
```

### QA Tiketi

**Opcija 1: Ticket Card**
Dodaj u header ili footer ticket kartice.

**Opcija 2: Ticket Detail View**
Dodaj u toolbar na detail view stranici tiketa.

**Opcija 3: Table Actions**
Dodaj u actions kolonu table-a sa tiketima.

Primer u ticket card:
```jsx
<div className="ticket-card">
  <div className="ticket-header">
    <h3>{ticket.title}</h3>
    <div className="actions">
      <button onClick={handleEdit}>Edit</button>
      <ShareButton item={ticket} type="ticket" variant="icon" />
    </div>
  </div>
  <div className="ticket-body">
    {/* ticket content */}
  </div>
</div>
```

## Šta se dešava kada korisnik share-uje

1. **Otvara se modal** sa listom svih dostupnih chat-ova (osim archived)
2. **Korisnik bira** u koji chat želi da pošalje
3. **Klikne Share** i poruka se šalje
4. **U chat-u se prikazuje** custom card sa:
   - Za elemente: Purple border, ikona elementa, naslov, workspace ime
   - Za tikete: Orange border, ClipboardList ikona, naslov, status badge, priority
5. **Click na card** vodi na odgovarajuću stranicu:
   - Element → `/workspace/{workspaceId}`
   - Ticket → `/qa-manager`

## Napomene

- **QA Tiketi** - Samo korisnici sa QA manager mejlom mogu da vide QA tikete u chat-u (već implementirano u backend-u)
- **Archived chats** - Ne prikazuju se u share modal-u
- **Navigation** - Klik na shared item automatski otvara odgovarajuću stranicu
