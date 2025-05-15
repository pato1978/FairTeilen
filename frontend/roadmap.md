# 📊 Fair Teilen – Projekt-Roadmap

## ✅ Erledigt
- [x] Projektstruktur für `personal`, `shared`, `child` eingerichtet
- [x] `BudgetProvider` modular pro Seite implementiert (nicht mehr global im Layout)
- [x] Monatsnavigation (`MonthProvider`) eingerichtet
- [x] Lokale Speicherung persönlicher Ausgaben mit SQLite und EF Core
- [x] Fetch-Logik für Budget & Expenses ausgelagert (`lib/api`)
- [x] `scope`-basierte API-Struktur (personal/shared/child) aufgebaut
- [x] Persönliche Ausgabenansicht (Modale, Budgetanzeige, Filter)

---

## 🔄 In Arbeit
- [ ] Zentrale REST-API für `shared` und `child`-Ausgaben über Blazor-Backend
- [ ] Gruppenspezifischer Zugriff (`group=A`, `group=B`) vorbereiten
- [ ] `BudgetProvider` um `group`-Prop erweitern
- [ ] Shared- und Child-Pages testen (API-Fetch, UI-Anzeige)

---

## 🟡 Geplant / Nächste Schritte
- [ ] Statistik-Seite: Balkendiagramm / Kategorien / Monatsvergleich
- [ ] Rollen & Nutzerverwaltung vorbereiten (Eltern, Kinder)
- [ ] Offline-Unterstützung (IndexedDB / Cache)
- [ ] Exportfunktion (CSV oder JSON)
- [ ] Sicherheit & Datenschutz:
    - [ ] Pseudonymisierung
    - [ ] SQLCipher-Verschlüsselung (lokal)
- [ ] Payment-Integration (PayPal.me, PayRequest)

---

## 🧠 Ideen / später prüfen
- [ ] Push-Nachrichten bei Budgetüberschreitung
- [ ] Reminder-Funktion für wiederkehrende Ausgaben
- [ ] In-App-Benachrichtigungen für Partner
- [ ] Integration mit Kalender (Monatsausgaben anzeigen)

---

📅 Letztes Update: Mai 2025  
🧑‍💻 Erstellt mit ChatGPT (Projektbegleitung aktiv)
