# Kniffel Online

Web-App als digitaler Kniffelblock fuer Runden mit echten Wuerfeln. Die App wuerfelt nicht selbst:
Spieler tragen die physisch gewuerfelten Augenzahlen ein, die Punkte werden serverseitig berechnet.

Aktueller Stand: funktionaler MVP mit Auth, Dashboard, Social/Freunde, Runden-Erstellung,
Invite-Beitritt, Spiel-Einladungen, digitalem Scoreblock, Ranking, Archiv und PostgreSQL per Docker.

Live-Version: `https://kniffel.bodmerlos.de`

Die Live-Version laeuft auf einem eigenen Mini-PC. Dieser dient als Webserver, betreibt die
PostgreSQL-Datenbank und leitet den externen Zugriff per Reverse Proxy an die App weiter.

## Tech-Stack

- Next.js 15 mit App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
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

## Lokale Datenbank

```bash
docker compose up -d
```

Die PostgreSQL-Datenbank laeuft danach auf `localhost:5432`.

Lokale Standardwerte:

```text
POSTGRES_USER=kniffel
POSTGRES_PASSWORD=kniffel_dev
POSTGRES_DB=kniffel
```

## Environment

```bash
cp .env.example .env
```

Lokaler Inhalt:

```env
DATABASE_URL="postgresql://kniffel:kniffel_dev@localhost:5432/kniffel"
NEXTAUTH_SECRET="change-me-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

Fuer Produktion muessen `DATABASE_URL`, `NEXTAUTH_SECRET` und `NEXTAUTH_URL` ersetzt werden.

## Prisma

```bash
npx prisma migrate dev
npx prisma generate
```

## Entwicklung starten

```bash
npm run dev
```

Die App ist danach unter `http://localhost:3000` erreichbar.

## Wichtige Seiten

- `/` Startseite
- `/login` Login
- `/register` Registrierung
- `/dashboard` Dashboard mit eigenen Runden, Requests und Statistiken
- `/social` Freunde, Freundschaftsanfragen und Online-Status
- `/games/new` Neue Runde
- `/games/[gameId]` Spielseite
- `/join` Invite-Code eingeben
- `/join/[inviteCode]` Direktbeitritt per Link

## Funktionsumfang

- Registrierung mit eindeutiger E-Mail und eindeutigem Username
- Login per E-Mail oder Username
- Passwort-Hashing mit bcrypt
- Signierte HTTP-only Cookie-Session
- Geschuetzte Seiten fuer eingeloggte Benutzer
- Dashboard mit aktiven Runden, Lobbys, Archiv und offenen Requests
- Runden erstellen, verlassen und als Owner loeschen
- Lobby mit mindestens 2 Spielern starten
- Beitritt per Invite-Code oder Invite-Link
- Freundschaftsanfragen senden, annehmen, ablehnen und Freunde entfernen
- Freunde online anzeigen
- Freunde zu Runden einladen
- Spiel-Einladungen annehmen oder ablehnen
- Physische Wuerfelergebnisse als fuenf Augenzahlen eintragen
- Automatische Punkteberechnung fuer alle freien Kategorien
- Kategorie-Empfehlungen fuer den aktuellen Wurf
- Serverseitige Neuberechnung beim Speichern
- Automatischer Spielerwechsel nach Eintragung
- Upper Bonus, Gesamtpunktzahl, Ranking und Gewinner-Ermittlung
- Gewinner-Feier nur fuer den eingeloggten Gewinner
- Inaktive aktive Spiele laufen aus und landen im Archiv

## Projektstruktur

```text
kniffel-app/
|- prisma/
|  `- schema.prisma
|- src/
|  |- app/
|  |  |- api/
|  |  |- dashboard/
|  |  |- games/
|  |  |- join/
|  |  |- login/
|  |  |- register/
|  |  `- social/
|  |- components/
|  |- game/
|  |- lib/
|  `- server/
|- docker-compose.yml
|- .env.example
|- package.json
`- README.md
```

## Datenmodell

Prisma enthaelt Modelle fuer:

- `User`
- `Game`
- `GamePlayer`
- `GameInvitation`
- `ScoreCard`
- `Turn`
- `FriendRequest`
- `Friendship`

Wichtige Status-Enums:

- `GameStatus`: `LOBBY`, `ACTIVE`, `FINISHED`
- `TurnStatus`: `ACTIVE`, `FINISHED`
- `GameInvitationStatus`: `PENDING`, `ACCEPTED`

## Spielablauf

1. Benutzer erstellt eine Runde.
2. Andere Spieler treten per Invite-Code bei oder werden als Freunde eingeladen.
3. Owner startet die Lobby ab 2 Spielern.
4. Der aktuelle Spieler wuerfelt physisch.
5. Er traegt die fuenf Augenzahlen in der App ein.
6. Die App berechnet moegliche Punkte und empfiehlt eine Kategorie.
7. Beim Speichern berechnet der Server die Punkte erneut.
8. Der naechste Spieler ist automatisch am Zug.
9. Wenn alle ScoreCards voll sind, wird die Runde beendet und ein Gewinner angezeigt.

## Qualitaetschecks

```bash
npm test
npm run lint
npm run build
```

Die Tests liegen aktuell unter `src/game/*.test.ts` und laufen ueber `node:test` mit `tsx`.

## Naechste sinnvolle Schritte

1. Realtime-Updates fuer Lobby, Spielstand und Social-Status sauber planen.
2. Datenbank- und Server-Action-Tests fuer Auth, Invites und Runden-Workflows ausbauen.
