# Deployment Configuration

Deze directory bevat alle configuratie bestanden voor productie deployment van de Straat-Praat applicatie.

## 📁 Bestanden

### `production.config.js`
Productie omgeving configuratie met alle instellingen voor:
- Database configuratie (PostgreSQL via Supabase)
- Redis caching
- Security instellingen (JWT, bcrypt, rate limiting)
- Monitoring en alerting
- Performance optimalisatie
- Service integraties

### `monitoring.js`
Productie monitoring en alerting setup met:
- System health checks (elke 30 seconden)
- Performance monitoring (response times, error rates)
- Security event monitoring
- Automated alerting (Slack, email)
- Incident response procedures

## 🚀 Deployment Stappen

### 1. Environment Variables
Zorg ervoor dat alle benodigde environment variables zijn ingesteld:

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Security
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=https://yourdomain.com

# Services
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_EMAIL_RECIPIENTS=admin@yourdomain.com

# Email
SENDGRID_API_KEY=your-api-key
FROM_EMAIL=noreply@yourdomain.com
```

### 2. Database Setup
```bash
# Run migrations
npm run db:migrate

# Setup RLS policies
npm run db:setup:security
```

### 3. Build en Deploy
```bash
# Build web versie
npm run build:web

# Build mobile versie
npm run build:mobile

# Deploy naar hosting platform
npm run deploy
```

### 4. Monitoring Starten
```bash
# Start production monitoring
node deployment/monitoring.js
```

## 🔒 Security Checklist

- [ ] Environment variables zijn veilig ingesteld
- [ ] Database RLS policies zijn geactiveerd
- [ ] MFA is verplicht voor alle gebruikers
- [ ] Rate limiting is geconfigureerd
- [ ] CORS origins zijn beperkt
- [ ] SSL/TLS is geactiveerd
- [ ] Security headers zijn ingesteld
- [ ] Monitoring en alerting is actief

## 📊 Monitoring Dashboard

De monitoring setup biedt real-time inzicht in:
- System health status
- Performance metrics
- Security events
- User activity
- Error rates en response times

## 🚨 Incident Response

Bij security incidents:
1. **Immediate**: Check monitoring dashboard
2. **Assessment**: Analyseer impact en scope
3. **Response**: Implementeer mitigatie maatregelen
4. **Recovery**: Herstel normale operaties
5. **Post-mortem**: Documenteer lessons learned

## 📞 Support

Voor deployment vragen of problemen:
- Check de monitoring dashboard
- Raadpleeg de security documentatie
- Neem contact op met het development team

## 🔄 Updates

Deze configuratie wordt regelmatig bijgewerkt met:
- Security patches
- Performance optimalisaties
- Nieuwe monitoring features
- Compliance updates
