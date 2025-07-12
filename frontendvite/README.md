# React-WA-App Projektdokumentation

## Projektübersicht

Diese Dokumentation bietet eine strukturierte Zusammenfassung des React-WA-App Projekts, einer Webanwendung zur
Verwaltung von Ausgaben und Budgets. Die Anwendung ermöglicht es Benutzern, persönliche, geteilte und kindbezogene
Ausgaben zu verfolgen und zu verwalten.

## Projektstruktur

Die Anwendung ist als React-Projekt mit TypeScript und Vite als Build-Tool aufgebaut. Hier ist eine Übersicht der
wichtigsten Verzeichnisse und Dateien:

### Hauptverzeichnisse

- **src/components**: UI-Komponenten, unterteilt in verschiedene Kategorien
    - **budget**: Budget-bezogene Komponenten
    - **charts**: Visualisierungskomponenten für Daten
    - **dashboard**: Dashboard-Komponenten wie Ausgabenlisten
    - **filters**: Filterkomponenten
    - **layout**: Layout-Komponenten für die Seitenstruktur
    - **modals**: Modal-Dialog-Komponenten
    - **ui**: Grundlegende UI-Komponenten
    - **theme-provider.tsx**: Theme-Management

- **src/context**: React Context für State-Management
    - **budget-context.tsx**: Budget-State-Management
    - **month-context.tsx**: Monatswahl-State-Management
    - **multi-budget-context.tsx**: Management mehrerer Budget-Bereiche

- **src/data**: Statische Daten
    - **users.ts**: Benutzer-Daten (Platzhalter)

- **src/lib**: Hilfsfunktionen und Utilities
    - **api/**: API-Funktionen für Backend-Kommunikation
        - **budget.ts**: Budget-API-Funktionen
        - **expenses.ts**: Ausgaben-API-Funktionen

- **src/pages**: Seitenkomponenten
    - **analyse**: Analyse-Seiten
    - **child**: Kindbezogene Ausgaben-Seiten
    - **home**: Startseite
    - **jahresuebersicht**: Jahresübersicht-Seiten
    - **personal**: Persönliche Ausgaben-Seiten
    - **profile**: Profilseiten
    - **shared**: Geteilte Ausgaben-Seiten
    - **statistics**: Statistik-Seiten
    - **trends**: Trend-Analyse-Seiten

- **src/types**: TypeScript-Typdefinitionen
    - **index.ts**: Haupttypen wie Expense, BudgetSummary, etc.

### Hauptdateien

- **src/App.tsx**: Hauptkomponente mit Routing-Konfiguration
- **src/main.tsx**: Einstiegspunkt der Anwendung
- **src/index.css**: Globale Styles

## React-Komponenten

### App.tsx

**Zweck/Funktion**: Hauptkomponente, die das Routing der Anwendung definiert.

**Wichtigste Props oder State-Elemente**: Keine Props, verwendet React Router für das Routing.

**Interaktionen**: Definiert Routen für verschiedene Seiten der Anwendung.

### ExpenseItem

**Zweck/Funktion**: Zeigt ein einzelnes Ausgabenelement an, mit Swipe-Funktionalität zum Löschen oder Bearbeiten.

**Wichtigste Props oder State-Elemente**:

- `item`: Expense-Objekt mit Details zur Ausgabe
- `onDelete`: Callback-Funktion zum Löschen einer Ausgabe
- `onEdit`: Callback-Funktion zum Bearbeiten einer Ausgabe
- `scopeFlags`: Optionale Flags für den Bereich (persönlich, geteilt, Kind)

**Interaktionen oder Nutzeraktionen**:

- Swipe nach links zum Löschen
- Swipe nach rechts zum Bearbeiten
- Klick auf Bestätigungsbutton zum Umschalten des Bestätigungsstatus

### MultiBudgetProvider

**Zweck/Funktion**: Context-Provider für Budget- und Ausgabendaten in verschiedenen Bereichen (persönlich, geteilt,
Kind).

**Wichtigste Props oder State-Elemente**:

- `children`: React-Nodes, die in den Provider eingebettet werden
- `states`: State-Objekt mit Budget und Ausgaben für jeden Bereich

**Interaktionen oder Nutzeraktionen**:

- Lädt Budget- und Ausgabendaten vom Backend beim Monatswechsel

## API-Zugriffe

Die Anwendung kommuniziert mit einem Backend-Server über HTTP-Anfragen. Hier sind die wichtigsten API-Endpunkte:

### Budget-API

**Endpunkte**:

- `GET /api/budget`: Abrufen des Budgets für einen bestimmten Bereich und Monat
- `PUT /api/budget`: Aktualisieren des Budgets für einen bestimmten Bereich und Monat

**Daten**:

- Abgerufene Daten: Budgetbetrag als Zahl
- Gesendete Daten: Bereich, Monat, Betrag, Benutzer-ID

### Ausgaben-API

**Endpunkte**:

- `GET /api/expenses`: Abrufen von Ausgaben für einen bestimmten Bereich, Gruppe und Monat

**Daten**:

- Abgerufene Daten: Array von Expense-Objekten mit Details zu jeder Ausgabe

## Platzhalter/Dummy-Daten

Die Anwendung verwendet einige Platzhalter-Daten:

### Benutzer-Daten

Die Datei `src/data/users.ts` enthält statische Benutzer-Daten mit vier vordefinierten Benutzern:

- Partner 1 (Hauptnutzer)
- Partner 2 (Partner)
- Partner 3 (Partner)
- Gast (Gastnutzer)

Jeder Benutzer hat eine eindeutige ID (GUID), Name, E-Mail, Rolle, Icon und Farbe.

## State-Management

Die Anwendung verwendet React Context API für das State-Management:

### MultiBudgetContext

Verwaltet Budget- und Ausgabendaten für drei Bereiche gleichzeitig:

- Persönlich
- Geteilt
- Kind

### MonthContext

Verwaltet die Auswahl des aktuellen Monats für die Anzeige von Budget- und Ausgabendaten.

### BudgetContext

Verwaltet Budget-Daten für einen einzelnen Bereich.

## Datenmodelle

Die wichtigsten Datenmodelle der Anwendung sind:

### Expense

Repräsentiert eine Ausgabe mit folgenden Eigenschaften:

- id: Eindeutige ID
- name: Name der Ausgabe
- amount: Betrag
- date: Datum
- category: Kategorie
- userId: Benutzer-ID
- isPersonal: Flag für persönliche Ausgabe
- isShared: Flag für geteilte Ausgabe
- isChild: Flag für kindbezogene Ausgabe
- isRecurring: Flag für wiederkehrende Ausgabe
- isBalanced: Flag für ausgeglichene Ausgabe

### BudgetSummary

Enthält Zusammenfassungsdaten für ein Budget:

- budget: Budgetbetrag
- expenses: Ausgabenbetrag
- percentageUsed: Prozentsatz des verwendeten Budgets

### UserAllocation

Repräsentiert die finanzielle Zuweisung eines Benutzers:

- name: Name des Benutzers
- total: Gesamtbetrag
- sharedContribution: Beitrag zu geteilten Ausgaben
- balance: Saldo

## Offene Fragen

1. Wie wird die Authentifizierung und Autorisierung gehandhabt? Die Anwendung verwendet localStorage für die
   Benutzer-ID, aber es ist unklar, wie die Anmeldung funktioniert.
2. Wie werden wiederkehrende Ausgaben (isRecurring) verarbeitet? Werden sie automatisch für zukünftige Monate erstellt?
3. Was ist der Unterschied zwischen isRecurring und isBalanced bei Ausgaben?
4. Wie werden Benutzergruppen verwaltet? Es gibt Kommentare über Gruppen-IDs, aber die Implementierung ist nicht
   vollständig.
5. Wie werden die verschiedenen Währungsformate international gehandhabt? Aktuell ist das Format auf "de-DE" festgelegt.