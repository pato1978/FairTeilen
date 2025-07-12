# Technische Dokumentation: React-WA-App

Diese Dokumentation bietet eine detaillierte technische Übersicht über die Komponenten, Seiten, Kontexte und
API-Funktionen der React-WA-App.

## Inhaltsverzeichnis

- [Komponenten](#komponenten)
- [Seiten](#seiten)
- [Kontext](#kontext)
- [API-Funktionen](#api-funktionen)

## Komponenten

### `src/components/theme-provider.tsx`

**Zweck:**  
Provider-Komponente für das Theme-Management der Anwendung.

**Props:**

- `children`: React-Nodes, die in den Provider eingebettet werden

**State:**

- Kein lokaler State

**Context:**

- Verwendet den ThemeProvider aus next-themes

**API-Zugriffe:**

- Keine

**Interaktionen:**

- Keine direkten Benutzerinteraktionen

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Konfiguriert das Theme-System mit Standardwerten
- Unterstützt helles und dunkles Theme

### `src/components/budget/budget-card.tsx`

**Zweck:**  
Zeigt eine Budgetkarte mit Zusammenfassung der Ausgaben und Budgetinformationen an.

**Props:**

- `title`: Titel der Budgetkarte
- `summary`: BudgetSummary-Objekt mit Budget- und Ausgabeninformationen
- `onBudgetChange`: Callback-Funktion zum Ändern des Budgets
- `icon`: Optionales Icon für die Karte
- `className`: Optionale CSS-Klassen

**State:**

- `isEditing`: Boolean, der angibt, ob das Budget bearbeitet wird
- `editValue`: Wert des Budgets während der Bearbeitung

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine direkten API-Zugriffe

**Interaktionen:**

- Klick auf Bearbeiten-Button zum Aktivieren des Bearbeitungsmodus
- Eingabe eines neuen Budgetwerts
- Klick auf Speichern-Button zum Speichern des neuen Budgets

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Zeigt Fortschrittsbalken für Budgetnutzung an
- Formatiert Währungsbeträge nach deutschem Format

### `src/components/charts/budget-chart.tsx`

**Zweck:**  
Visualisiert Budgetdaten als Kreisdiagramm.

**Props:**

- `data`: Array von Datenpunkten für das Diagramm
- `className`: Optionale CSS-Klassen

**State:**

- Kein lokaler State

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine

**Interaktionen:**

- Hover über Diagrammsegmente zeigt Details an

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Verwendet Recharts für die Diagrammdarstellung
- Responsive Anpassung an verschiedene Bildschirmgrößen

### `src/components/dashboard/expense-item.tsx`

**Zweck:**  
Zeigt ein einzelnes Ausgabenelement an, mit Swipe-Funktionalität zum Löschen oder Bearbeiten.

**Props:**

- `item`: Expense-Objekt mit Details zur Ausgabe
- `onDelete`: Callback-Funktion zum Löschen einer Ausgabe
- `onEdit`: Callback-Funktion zum Bearbeiten einer Ausgabe
- `scopeFlags`: Optionale Flags für den Bereich (persönlich, geteilt, Kind)

**State:**

- `isDeleting`: Boolean, der angibt, ob die Löschbestätigung angezeigt wird

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine direkten API-Zugriffe

**Interaktionen:**

- Swipe nach links zum Löschen
- Swipe nach rechts zum Bearbeiten
- Klick auf Bestätigungsbutton zum Umschalten des Bestätigungsstatus

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Verwendet react-swipeable für Swipe-Gesten
- Zeigt verschiedene Icons für wiederkehrende und ausgeglichene Ausgaben
- Farbkodierung basierend auf Ausgabentyp

### `src/components/dashboard/expense-list.tsx`

**Zweck:**  
Zeigt eine Liste von Ausgaben an, gruppiert nach Datum.

**Props:**

- `expenses`: Array von Expense-Objekten
- `onDelete`: Callback-Funktion zum Löschen einer Ausgabe
- `onEdit`: Callback-Funktion zum Bearbeiten einer Ausgabe
- `scopeFlags`: Optionale Flags für den Bereich (persönlich, geteilt, Kind)

**State:**

- Kein lokaler State

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine direkten API-Zugriffe

**Interaktionen:**

- Interaktionen werden an die einzelnen ExpenseItem-Komponenten delegiert

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Gruppiert Ausgaben nach Datum
- Berechnet Summen für jede Datumsgruppe

### `src/components/filters/date-filter.tsx`

**Zweck:**  
Ermöglicht die Filterung von Daten nach Datum oder Zeitraum.

**Props:**

- `onChange`: Callback-Funktion, die bei Änderung des Filters aufgerufen wird
- `value`: Aktueller Filterwert
- `className`: Optionale CSS-Klassen

**State:**

- `selectedOption`: Ausgewählte Filteroption

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine

**Interaktionen:**

- Auswahl einer Filteroption aus einem Dropdown-Menü
- Eingabe von Datumswerten

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Unterstützt verschiedene Filteroptionen (Tag, Woche, Monat, benutzerdefiniert)
- Dynamische Anpassung der Eingabefelder je nach ausgewählter Option

### `src/components/layout/bottom-navigation.tsx`

**Zweck:**  
Zeigt eine Navigation am unteren Bildschirmrand an.

**Props:**

- `className`: Optionale CSS-Klassen

**State:**

- Kein lokaler State

**Context:**

- Verwendet usePathname aus next/navigation

**API-Zugriffe:**

- Keine

**Interaktionen:**

- Klick auf Navigationslinks zum Wechseln zwischen Seiten

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Hervorgehobene Anzeige des aktuell aktiven Menüpunkts
- Responsive Anpassung für mobile Geräte

### `src/components/modals/expense-editor-modal.tsx`

**Zweck:**  
Modales Formular zur Erstellung oder Bearbeitung einer Ausgabe.

**Props:**

- `expense`: Optionales Expense-Objekt
- `onSave`: Callback-Funktion zum Speichern der Eingabe
- `onCancel`: Callback-Funktion zum Abbrechen
- `scopeFlags`: Optionale Flags für den Bereich (persönlich, geteilt, Kind)

**State:**

- `formData`: Enthält Felder wie `amount`, `date`, `name`, `category`, etc.
- `isSubmitting`: Boolean, der angibt, ob das Formular gerade abgesendet wird

**Context:**

- Verwendet UserContext für Benutzerinformationen

**API-Zugriffe:**

- Keine direkten API-Zugriffe

**Interaktionen:**

- Eingabe von Ausgabendaten in Formularfelder
- Umschalten von Toggles für wiederkehrende und ausgeglichene Ausgaben
- Klick auf Speichern-Button zum Absenden des Formulars
- Klick auf Abbrechen-Button zum Schließen des Modals

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Validierung der Eingabefelder
- Dynamische Anpassung der Formularfelder je nach Ausgabentyp
- Unterstützung für Bearbeitung bestehender Ausgaben

## Seiten

### `src/pages/budget-page-inner.tsx`

**Zweck:**  
Innere Komponente für die Budget-Seite, die Budget- und Ausgabeninformationen anzeigt.

**Props:**

- `scope`: Bereich der Budgetseite (persönlich, geteilt, Kind)
- `title`: Titel der Seite
- `icon`: Icon für die Seite

**State:**

- `isAddingExpense`: Boolean, der angibt, ob das Modal zum Hinzufügen einer Ausgabe geöffnet ist
- `editingExpense`: Aktuell bearbeitete Ausgabe oder null

**Context:**

- Verwendet MultiBudgetContext für Budget- und Ausgabendaten
- Verwendet MonthContext für die aktuelle Monatsauswahl

**API-Zugriffe:**

- Indirekt über MultiBudgetContext:
    - GET /api/budget
    - GET /api/expenses
    - POST /api/expenses
    - PUT /api/expenses/{id}
    - DELETE /api/expenses/{id}

**Interaktionen:**

- Klick auf "Ausgabe hinzufügen"-Button zum Öffnen des Modals
- Bearbeiten oder Löschen von Ausgaben in der Liste
- Ändern des Budgetwerts

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Dynamische Anzeige von Budget und Ausgaben basierend auf dem ausgewählten Monat
- Berechnung von Budgetzusammenfassungen

### `src/pages/layout.tsx`

**Zweck:**  
Hauptlayout-Komponente, die die Struktur aller Seiten definiert.

**Props:**

- `children`: React-Nodes, die in das Layout eingebettet werden

**State:**

- Kein lokaler State

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine

**Interaktionen:**

- Keine direkten Benutzerinteraktionen

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Definiert die grundlegende Seitenstruktur mit Header und Footer
- Responsive Anpassung für verschiedene Bildschirmgrößen

### `src/pages/home/page.tsx`

**Zweck:**  
Startseite der Anwendung, die eine Übersicht über alle Budgetbereiche bietet.

**Props:**

- Keine

**State:**

- `isAddingExpense`: Boolean, der angibt, ob das Modal zum Hinzufügen einer Ausgabe geöffnet ist
- `selectedScope`: Aktuell ausgewählter Bereich für neue Ausgaben

**Context:**

- Verwendet MultiBudgetContext für Budget- und Ausgabendaten
- Verwendet MonthContext für die aktuelle Monatsauswahl

**API-Zugriffe:**

- Indirekt über MultiBudgetContext:
    - GET /api/budget
    - GET /api/expenses

**Interaktionen:**

- Klick auf "Ausgabe hinzufügen"-Button zum Öffnen des Modals
- Auswahl eines Bereichs für neue Ausgaben
- Navigation zu detaillierten Bereichsseiten

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Zeigt Zusammenfassungen für alle Budgetbereiche
- Schnellzugriff auf häufig verwendete Funktionen

### `src/pages/personal/page.tsx`

**Zweck:**  
Seite für persönliche Ausgaben und Budget.

**Props:**

- Keine

**State:**

- Kein lokaler State

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine direkten API-Zugriffe

**Interaktionen:**

- Interaktionen werden an BudgetPageInner delegiert

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Verwendet BudgetPageInner mit scope="personal"

### `src/pages/shared/page.tsx`

**Zweck:**  
Seite für geteilte Ausgaben und Budget.

**Props:**

- Keine

**State:**

- Kein lokaler State

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine direkten API-Zugriffe

**Interaktionen:**

- Interaktionen werden an BudgetPageInner delegiert

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Verwendet BudgetPageInner mit scope="shared"

### `src/pages/child/page.tsx`

**Zweck:**  
Seite für kindbezogene Ausgaben und Budget.

**Props:**

- Keine

**State:**

- Kein lokaler State

**Context:**

- Kein Context verwendet

**API-Zugriffe:**

- Keine direkten API-Zugriffe

**Interaktionen:**

- Interaktionen werden an BudgetPageInner delegiert

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Verwendet BudgetPageInner mit scope="child"

### `src/pages/statistics/page.tsx`

**Zweck:**  
Seite zur Anzeige von Statistiken über Ausgaben und Budget.

**Props:**

- Keine

**State:**

- `activeTab`: Aktuell ausgewählter Tab (Übersicht, Kategorien, Benutzer)

**Context:**

- Verwendet MultiBudgetContext für Budget- und Ausgabendaten
- Verwendet MonthContext für die aktuelle Monatsauswahl

**API-Zugriffe:**

- Indirekt über MultiBudgetContext:
    - GET /api/budget
    - GET /api/expenses

**Interaktionen:**

- Wechsel zwischen verschiedenen Statistik-Tabs
- Interaktion mit Diagrammen (Hover, Klick)

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Visualisierung von Ausgabendaten in verschiedenen Diagrammtypen
- Berechnung von statistischen Kennzahlen

### `src/pages/profile/page.tsx`

**Zweck:**  
Profilseite für Benutzereinstellungen.

**Props:**

- Keine

**State:**

- `user`: Aktueller Benutzer
- `isEditing`: Boolean, der angibt, ob das Profil bearbeitet wird

**Context:**

- Verwendet UserContext für Benutzerinformationen

**API-Zugriffe:**

- Keine echten API-Zugriffe, verwendet lokale Speicherung

**Interaktionen:**

- Bearbeiten von Profilinformationen
- Ändern von Benutzereinstellungen
- Speichern von Profiländerungen

**Platzhalterdaten:**  
Ja, verwendet Benutzerdaten aus src/data/users.ts

**Besonderheiten:**

- Verwaltung von Benutzereinstellungen
- Profilbild-Upload-Funktion

## Kontext

### `src/context/budget-context.tsx`

**Zweck:**  
Context für die Verwaltung von Budget- und Ausgabendaten für einen einzelnen Bereich.

**Props:**

- `children`: React-Nodes, die in den Provider eingebettet werden
- `scope`: Bereich des Budgets (persönlich, geteilt, Kind)

**State:**

- `budget`: Aktueller Budgetwert
- `expenses`: Array von Ausgaben
- `isLoading`: Ladezustand
- `error`: Fehlerzustand

**Context:**

- Verwendet MonthContext für die aktuelle Monatsauswahl

**API-Zugriffe:**

- GET /api/budget
- PUT /api/budget
- GET /api/expenses
- POST /api/expenses
- PUT /api/expenses/{id}
- DELETE /api/expenses/{id}

**Interaktionen:**

- Keine direkten Benutzerinteraktionen

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Automatisches Neuladen von Daten bei Monatsänderung
- Berechnung von Budgetzusammenfassungen

### `src/context/month-context.tsx`

**Zweck:**  
Context für die Verwaltung der aktuellen Monatsauswahl.

**Props:**

- `children`: React-Nodes, die in den Provider eingebettet werden

**State:**

- `currentMonth`: Aktuell ausgewählter Monat (Date-Objekt)

**Context:**

- Kein anderer Context verwendet

**API-Zugriffe:**

- Keine

**Interaktionen:**

- Keine direkten Benutzerinteraktionen

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Stellt Hilfsfunktionen für Monatsnavigation bereit
- Formatiert Monatsdaten für die Anzeige

### `src/context/multi-budget-context.tsx`

**Zweck:**  
Context für die Verwaltung von Budget- und Ausgabendaten für mehrere Bereiche gleichzeitig.

**Props:**

- `children`: React-Nodes, die in den Provider eingebettet werden

**State:**

- `states`: Objekt mit Budget- und Ausgabendaten für jeden Bereich
- `isLoading`: Ladezustand
- `error`: Fehlerzustand

**Context:**

- Verwendet MonthContext für die aktuelle Monatsauswahl

**API-Zugriffe:**

- GET /api/budget (für jeden Bereich)
- PUT /api/budget (für jeden Bereich)
- GET /api/expenses (für jeden Bereich)
- POST /api/expenses
- PUT /api/expenses/{id}
- DELETE /api/expenses/{id}

**Interaktionen:**

- Keine direkten Benutzerinteraktionen

**Platzhalterdaten:**  
Nein

**Besonderheiten:**

- Verwaltet Daten für drei Bereiche gleichzeitig: persönlich, geteilt, Kind
- Berechnet bereichsübergreifende Zusammenfassungen

## API-Funktionen

### `src/lib/api/budget.ts`

**Zweck:**  
Enthält Funktionen für API-Zugriffe auf Budget-Daten.

**Funktionen:**

- `getBudget`: Ruft das Budget für einen bestimmten Bereich und Monat ab
- `updateBudget`: Aktualisiert das Budget für einen bestimmten Bereich und Monat

**API-Zugriffe:**

- GET /api/budget
- PUT /api/budget

**Besonderheiten:**

- Implementiert Fehlerbehandlung und Wiederholungsversuche
- Unterstützt verschiedene Bereiche (persönlich, geteilt, Kind)

### `src/lib/api/expenses.ts`

**Zweck:**  
Enthält Funktionen für API-Zugriffe auf Ausgaben-Daten.

**Funktionen:**

- `getExpenses`: Ruft Ausgaben für einen bestimmten Bereich, Gruppe und Monat ab
- `createExpense`: Erstellt eine neue Ausgabe
- `updateExpense`: Aktualisiert eine bestehende Ausgabe
- `deleteExpense`: Löscht eine Ausgabe

**API-Zugriffe:**

- GET /api/expenses
- POST /api/expenses
- PUT /api/expenses/{id}
- DELETE /api/expenses/{id}

**Besonderheiten:**

- Implementiert Fehlerbehandlung und Wiederholungsversuche
- Unterstützt Filterung nach Datum und Bereich
- Verarbeitet komplexe Ausgabenstrukturen mit verschiedenen Flags