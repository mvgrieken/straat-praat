# Straat-Praat API Documentatie

## 📋 Overzicht

De Straat-Praat API is een RESTful API die toegang biedt tot de straattaal database, vertalingen, quizzen en beveiligingsfuncties. Deze documentatie beschrijft alle beschikbare endpoints, authenticatie en gebruiksvoorbeelden.

## 🔐 Authenticatie

### API Keys
Alle API requests vereisen een geldige API key in de header:
```
Authorization: Bearer YOUR_API_KEY
```

### Twee-Factor Authenticatie
Voor gevoelige endpoints is 2FA vereist. Voeg de 2FA code toe aan de header:
```
X-2FA-Code: 123456
```

## 📚 Endpoints

### Authenticatie

#### POST /auth/register
Registreer een nieuwe gebruiker.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Registratie succesvol. Controleer je e-mail voor verificatie."
}
```

#### POST /auth/login
Log in met e-mail en wachtwoord.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-02T00:00:00.000Z"
  }
}
```

#### POST /auth/logout
Log uit en vernietig de sessie.

**Response:**
```json
{
  "success": true,
  "message": "Uitgelogd"
}
```

#### POST /auth/forgot-password
Verstuur een wachtwoord reset e-mail.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wachtwoord reset e-mail verstuurd"
}
```

### Woorden en Vertalingen

#### GET /words/search
Zoek naar woorden in de database.

**Query Parameters:**
- `q` (string, required): Zoekterm
- `limit` (number, optional): Maximum aantal resultaten (default: 10)
- `offset` (number, optional): Aantal resultaten om over te slaan (default: 0)

**Response:**
```json
{
  "success": true,
  "words": [
    {
      "id": "word_123",
      "word": "bussin",
      "definition": "Zeer goed, geweldig",
      "category": "positief",
      "examples": [
        "Deze pizza is echt bussin!",
        "Die nieuwe film was bussin"
      ],
      "usage_count": 1250,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

#### GET /words/{id}
Haal een specifiek woord op.

**Response:**
```json
{
  "success": true,
  "word": {
    "id": "word_123",
    "word": "bussin",
    "definition": "Zeer goed, geweldig",
    "category": "positief",
    "examples": [
      "Deze pizza is echt bussin!",
      "Die nieuwe film was bussin"
    ],
    "synonyms": ["sick", "fire", "lit"],
    "antonyms": ["trash", "mid"],
    "usage_count": 1250,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /words
Voeg een nieuw woord toe (admin only).

**Request Body:**
```json
{
  "word": "cap",
  "definition": "Liegen, onzin verkopen",
  "category": "negatief",
  "examples": [
    "Hij cap't altijd over zijn nieuwe auto",
    "Stop met cap'en"
  ],
  "synonyms": ["liegen", "bullshitten"],
  "antonyms": ["echt", "waar"]
}
```

#### POST /translate
Vertaal tekst met AI.

**Request Body:**
```json
{
  "text": "Deze pizza is echt bussin!",
  "source_language": "nl",
  "target_language": "nl",
  "context": "straattaal naar standaard Nederlands"
}
```

**Response:**
```json
{
  "success": true,
  "translation": {
    "original": "Deze pizza is echt bussin!",
    "translated": "Deze pizza is echt geweldig!",
    "explanation": "Bussin betekent 'zeer goed' of 'geweldig' in straattaal",
    "confidence": 0.95
  }
}
```

### Quizzen

#### GET /quizzes
Haal beschikbare quizzen op.

**Query Parameters:**
- `level` (string, optional): Niveau filter (beginner, intermediate, expert)
- `category` (string, optional): Categorie filter

**Response:**
```json
{
  "success": true,
  "quizzes": [
    {
      "id": "quiz_123",
      "title": "Basis Straattaal",
      "description": "Leer de fundamenten van straattaal",
      "level": "beginner",
      "category": "algemeen",
      "question_count": 10,
      "estimated_time": 300,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /quizzes/{id}
Haal een specifieke quiz op.

**Response:**
```json
{
  "success": true,
  "quiz": {
    "id": "quiz_123",
    "title": "Basis Straattaal",
    "description": "Leer de fundamenten van straattaal",
    "level": "beginner",
    "category": "algemeen",
    "questions": [
      {
        "id": "q_1",
        "question": "Wat betekent 'bussin'?",
        "type": "multiple_choice",
        "options": [
          "Zeer goed",
          "Slecht",
          "Gewoon",
          "Moeilijk"
        ],
        "correct_answer": 0,
        "explanation": "Bussin betekent 'zeer goed' of 'geweldig'"
      }
    ],
    "time_limit": 300
  }
}
```

#### POST /quizzes/{id}/submit
Dien een quiz antwoord in.

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "q_1",
      "answer": 0,
      "time_taken": 15
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "score": 8,
    "total_questions": 10,
    "percentage": 80,
    "time_taken": 245,
    "correct_answers": 8,
    "incorrect_answers": 2,
    "feedback": [
      {
        "question_id": "q_1",
        "correct": true,
        "explanation": "Goed gedaan! Bussin betekent inderdaad 'zeer goed'"
      }
    ]
  }
}
```

### Beveiliging

#### GET /security/status
Haal beveiligingsstatus op.

**Response:**
```json
{
  "success": true,
  "security": {
    "mfa_enabled": true,
    "mfa_activated_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-01T12:00:00.000Z",
    "login_attempts": 0,
    "suspicious_activities": 0
  }
}
```

#### POST /security/mfa/setup
Start MFA setup proces.

**Response:**
```json
{
  "success": true,
  "mfa": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "backup_codes": ["ABC12345", "DEF67890"]
  }
}
```

#### POST /security/mfa/activate
Activeer MFA met verificatiecode.

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA succesvol geactiveerd"
}
```

#### POST /security/mfa/verify
Verificeer MFA code.

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MFA verificatie succesvol"
}
```

#### POST /security/mfa/backup
Verificeer backup code.

**Request Body:**
```json
{
  "backup_code": "ABC12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backup code verificatie succesvol"
}
```

### Gebruikersprofiel

#### GET /profile
Haal gebruikersprofiel op.

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "preferences": {
      "notifications": true,
      "daily_reminder": true,
      "quiz_reminder": true
    },
    "stats": {
      "quizzes_completed": 25,
      "words_learned": 150,
      "streak_days": 7,
      "total_score": 1850
    },
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /profile
Update gebruikersprofiel.

**Request Body:**
```json
{
  "name": "John Smith",
  "preferences": {
    "notifications": false,
    "daily_reminder": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "user_123",
    "name": "John Smith",
    "preferences": {
      "notifications": false,
      "daily_reminder": true
    }
  }
}
```

### Statistieken

#### GET /stats/overview
Haal overzicht statistieken op.

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_users": 1250,
    "total_words": 5000,
    "total_quizzes": 100,
    "daily_active_users": 450,
    "weekly_active_users": 850,
    "monthly_active_users": 1200
  }
}
```

#### GET /stats/user/{id}
Haal gebruikersstatistieken op.

**Response:**
```json
{
  "success": true,
  "stats": {
    "user_id": "user_123",
    "quizzes_completed": 25,
    "average_score": 85.5,
    "words_learned": 150,
    "streak_days": 7,
    "total_time_spent": 3600,
    "favorite_categories": ["positief", "negatief"],
    "improvement_rate": 15.2
  }
}
```

## 🚨 Error Handling

### Error Response Format
Alle errors volgen hetzelfde formaat:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ongeldige invoer",
    "details": {
      "field": "email",
      "issue": "Ongeldig e-mail formaat"
    }
  }
}
```

### Error Codes

| Code | Beschrijving | HTTP Status |
|------|-------------|-------------|
| `AUTHENTICATION_ERROR` | Ongeldige API key | 401 |
| `AUTHORIZATION_ERROR` | Onvoldoende rechten | 403 |
| `VALIDATION_ERROR` | Ongeldige invoer | 400 |
| `NOT_FOUND` | Resource niet gevonden | 404 |
| `RATE_LIMIT_EXCEEDED` | Te veel requests | 429 |
| `INTERNAL_ERROR` | Server fout | 500 |
| `MFA_REQUIRED` | 2FA vereist | 403 |
| `MFA_INVALID` | Ongeldige 2FA code | 400 |

## 📊 Rate Limiting

- **Standard**: 100 requests per minuut
- **Premium**: 1000 requests per minuut
- **Admin**: 5000 requests per minuut

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔒 Beveiliging

### Best Practices
1. **Gebruik HTTPS** voor alle requests
2. **Bewaar API keys veilig** en deel ze niet
3. **Implementeer 2FA** voor gevoelige operaties
4. **Valideer alle invoer** lokaal en server-side
5. **Log security events** voor monitoring

### Data Versleuteling
- Alle data wordt versleuteld in transit (TLS 1.3)
- Gevoelige data wordt versleuteld at rest (AES-256)
- API keys worden gehashed met bcrypt

## 📝 SDK's en Libraries

### JavaScript/TypeScript
```bash
npm install @straat-praat/api-client
```

```javascript
import { StraatPraatAPI } from '@straat-praat/api-client';

const api = new StraatPraatAPI('YOUR_API_KEY');

// Zoek woorden
const words = await api.words.search('bussin');

// Vertaal tekst
const translation = await api.translate('Deze pizza is bussin!');
```

### Python
```bash
pip install straat-praat-api
```

```python
from straat_praat_api import StraatPraatAPI

api = StraatPraatAPI('YOUR_API_KEY')

# Zoek woorden
words = api.words.search('bussin')

# Vertaal tekst
translation = api.translate('Deze pizza is bussin!')
```

## 🔄 Webhooks

Configureer webhooks voor real-time updates:

```json
{
  "url": "https://your-app.com/webhooks/straat-praat",
  "events": ["word.created", "quiz.completed", "user.registered"],
  "secret": "webhook_secret_123"
}
```

### Webhook Events
- `word.created`: Nieuw woord toegevoegd
- `word.updated`: Woord bijgewerkt
- `quiz.completed`: Quiz voltooid
- `user.registered`: Nieuwe gebruiker
- `security.alert`: Beveiligingsmelding

## 📞 Support

### API Support
- **Documentatie**: https://api.straat-praat.nl/docs
- **Status**: https://status.straat-praat.nl
- **E-mail**: api-support@straat-praat.nl
- **Discord**: https://discord.gg/straat-praat

### Rate Limits
- **Standard**: 100/min
- **Premium**: 1000/min
- **Enterprise**: Custom

---

**API Versie**: v1.0.0
**Laatste update**: December 2024
**Base URL**: https://api.straat-praat.nl/v1
