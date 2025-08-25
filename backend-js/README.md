# ZK-Auth Backend (JavaScript/TypeScript)

Backend dla systemu autoryzacji zero-knowledge przepisany z Rust do JavaScript/TypeScript.

## Funkcjonalności

- **Tradycyjna autoryzacja**: rejestracja i logowanie z plaintext hasłami
- **Hashed autoryzacja**: rejestracja i logowanie z Argon2 hashed hasłami  
- **Zero-Knowledge autoryzacja**: rejestracja i logowanie z ZK proofs
- **Challenge system**: generowanie nonce dla ZK authentication
- **Salt retrieval**: pobieranie salt dla użytkowników ZK

## API Endpoints

### Tradycyjna autoryzacja
- `POST /auth/register` - rejestracja użytkownika
- `POST /auth/login` - logowanie użytkownika

### Hashed autoryzacja  
- `POST /auth/register_hashed` - rejestracja z hashed hasłem
- `POST /auth/login_hashed` - logowanie z hashed hasłem

### Zero-Knowledge autoryzacja
- `POST /auth/zk/register` - rejestracja ZK użytkownika
- `POST /auth/zk/login` - logowanie ZK z proof
- `GET /auth/zk/challenge/{username}` - pobierz challenge (nonce)
- `GET /auth/zk/salt/{username}` - pobierz salt użytkownika

### Utility
- `GET /health` - sprawdzenie stanu serwera

## Instalacja

```bash
cd backend-js
npm install
```

## Konfiguracja

Skopiuj `.env.example` do `.env` i dostosuj konfigurację:

```bash
cp .env.example .env
```

## Uruchamianie

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Argumenty CLI

```bash
node dist/index.js --help
```

- `--bind` - adres serwera (domyślnie: 0.0.0.0)
- `--port` - port serwera (domyślnie: 8080)
- `--surreal-url` - URL bazy SurrealDB
- `--surreal-user` - użytkownik SurrealDB
- `--surreal-pass` - hasło SurrealDB  
- `--surreal-namespace` - namespace SurrealDB
- `--surreal-database` - baza SurrealDB

## Wymagania

- Node.js >= 18
- SurrealDB
- Barretenberg CLI (`/home/uacias/.bb/bb`) dla weryfikacji ZK proofs
- ZK circuit w `../target/zk.json`

## Struktura

```
src/
├── config/          # Konfiguracja CLI
├── errors/          # Obsługa błędów
├── middleware/      # Express middleware
├── models/          # Modele danych i walidacja
├── routes/          # Route handlers
├── services/        # Logika biznesowa
├── utils/           # Utilities (crypto, database, logger)
└── index.ts         # Punkt wejścia
```