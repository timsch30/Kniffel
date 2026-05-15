# Kniffel Online

Responsive SaaS-MVP fuer eine Kniffel-Begleit-App. Die Spieler wuerfeln physisch mit echten Wuerfeln; die Web-App dient als digitaler Kniffelblock zur Dokumentation der Runde.

Der aktuelle Stand ist ein funktionaler MVP-Kern: Auth, Runden-Erstellung, Invite-Beitritt, digitaler Scoreblock, Prisma-Schema und lokale PostgreSQL-Datenbank per Docker Compose.

## Tech-Stack

- Next.js mit App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Docker Compose
- ESLint
- bcrypt

## Voraussetzungen

- Node.js 20 oder neuer
- npm
- Docker Desktop oder kompatible Docker-Installation

## Installation

```bash
npm install
```

## Lokale Datenbank starten

```bash
docker compose up -d
```

Die lokale PostgreSQL-Datenbank laeuft danach auf `localhost:5432`.

Konfiguration:

- `POSTGRES_USER=kniffel`
- `POSTGRES_PASSWORD=kniffel_dev`
- `POSTGRES_DB=kniffel`

Die Daten werden im Docker-Volume `postgres_data` persistent gespeichert.

## Environment anlegen

```bash
cp .env.example .env
```

Inhalt fuer lokale Entwicklung:

```env
DATABASE_URL="postgresql://kniffel:kniffel_dev@localhost:5432/kniffel"
NEXTAUTH_SECRET="change-me-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

Alle spaeter serverrelevanten Werte laufen ueber Umgebungsvariablen. Fuer Produktion muessen `DATABASE_URL`, `NEXTAUTH_SECRET` und `NEXTAUTH_URL` ersetzt werden.

## Prisma Migration ausfuehren

```bash
npx prisma migrate dev --name init
```

Optional Prisma Client neu generieren:

```bash
npx prisma generate
```

## Dev-Server starten

```bash
npm run dev
```

Danach ist die App lokal unter `http://localhost:3000` erreichbar.

## Wichtige Seiten

- `/` Startseite
- `/login` Login-UI
- `/register` Register-UI
- `/dashboard` Dashboard-Platzhalter
- `/games/new` Neue Runde
- `/games/[gameId]` Spielseite
- `/join/[inviteCode]` Beitrittsseite

## Projektstruktur

```text
kniffel-app/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ app/
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ layout/
│  │  └─ game/
│  ├─ lib/
│  ├─ game/
│  └─ server/
├─ docker-compose.yml
├─ .env.example
├─ README.md
├─ package.json
└─ tsconfig.json
```

## Aktueller Funktionsumfang

- Saubere Next.js-App-Router-Struktur
- Wiederverwendbare Komponenten fuer Button, Input, Card, Header und Layout
- Responsive Platzhalterseiten fuer Start, Login, Registrierung, Dashboard, Spielanlage, Spielansicht und Join-Link
- Prisma-Datenmodell fuer User, Game, GamePlayer, ScoreCard und Turn
- Enums fuer Game- und Turn-Status
- Eindeutige Felder fuer E-Mail, Username und Invite-Code
- ScoreCard-Helfer fuer Bonus, Gesamtpunktzahl, belegte Kategorien und Spielende
- Registrierung mit eindeutiger E-Mail und eindeutigem Username
- Login mit E-Mail oder Username
- Passwort-Hashing mit bcrypt
- Signierte HTTP-only Cookie-Session
- Logout im Header
- Geschuetzte Seiten fuer `/dashboard`, `/games/new` und `/games/[gameId]`
- Formularvalidierung und einfache Fehlermeldungen fuer Login und Registrierung
- Echte Runden-Erstellung mit Game, erstem GamePlayer und ScoreCard
- Eindeutige kurze Invite-Codes fuer neue Runden
- Beitritt zu Runden ueber `/join/[inviteCode]`
- Dashboard zeigt echte Runden des eingeloggten Benutzers
- Owner kann eine Lobby mit mindestens 2 Spielern starten
- Spielseite zeigt Rundenname, Status, Invite-Code, Einladungslink, Spielerliste, aktuellen Spieler und Score-Tabelle
- Aktueller Spieler klickt die physisch gewuerfelten Augenzahlen ein
- App berechnet freie Score-Kategorien automatisch und der Spieler waehlt eine Kategorie
- Nach Eintragung wechselt der aktuelle Spieler automatisch
- Upper Bonus, Gesamtpunktzahl und Spielende werden berechnet
- Gewinner wird nach Spielende angezeigt
- Keine digitale Wuerfellogik im Spielablauf

## Naechste sinnvolle Schritte

1. Score-Eintraege visuell besser hervorheben und Bedienung weiter verbessern.
2. Realtime-Updates planen, zum Beispiel spaeter per WebSocket oder Server-Sent Events.
3. Tests fuer Auth, Runden-Workflows, ScoreCard-Regeln und Datenbank-Workflows ausbauen.

## Punkte eintragen

Die App wuerfelt nicht digital. Der aktuelle Spieler wuerfelt physisch und klickt danach die fuenf
sichtbaren Augenzahlen in der App an. Sobald genau 5 Werte gewaehlt sind, berechnet die App die
moeglichen Punkte fuer alle Kategorien. Bereits belegte Kategorien bleiben sichtbar, sind aber
deaktiviert.

Beim Eintragen sendet der Client nur Kategorie und Augenzahlen. Die Punktzahl wird serverseitig
erneut berechnet und gespeichert.

## Runden erstellen und beitreten

Eingeloggte Benutzer koennen ueber `/games/new` eine Runde erstellen. Dabei werden Game,
GamePlayer und ScoreCard gemeinsam angelegt. Nach Erfolg fuehrt die App direkt zur Spielseite.

Jede Runde erhaelt einen eindeutigen Invite-Code. Der Code und der Einladungslink werden auf der
Spielseite angezeigt.

Andere eingeloggte Benutzer koennen ueber `/join/[inviteCode]` beitreten. Doppelte Beitritte werden
verhindert; bestehende Spieler werden direkt zur Runde weitergeleitet.

## Qualitaetschecks

```bash
npm run lint
npm run build
```

Diese Befehle setzen voraus, dass `npm install` bereits ausgefuehrt wurde.
