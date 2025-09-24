Gmail SMTP setup for local testing

- Use an App Password (recommended) if the Gmail account has 2FA enabled.
- Steps:
  1. Sign in to the Google Account used for `SMTP_USERNAME`.
  2. Enable 2-Step Verification in Security > 2-Step Verification.
  3. Under Security > App passwords, create a new App password for `Mail` on `Other (Custom name)` and name it `Orbitr`.
  4. Copy the generated 16-character password and put it in your local `.env` as `SMTP_PASSWORD` (no quotes).

Local testing:

1. Copy `.env.example` to `.env` and fill values. Do NOT commit `.env`.
2. Start Postgres (if using docker-compose):

```powershell
# from repo root
docker-compose up -d postgres
```

3. Run the application through `run-local.ps1` which loads `.env` into process env and starts Spring Boot:

```powershell
.\run-local.ps1
```

4. Use the API endpoint to test email:

```powershell
curl -X POST http://localhost:8080/api/email/test -H "Content-Type: application/json" -d '{"email":"you@domain.com"}'
```

Troubleshooting:
- If you get `AuthenticationFailedException` from Gmail, verify the `SMTP_USERNAME` and `SMTP_PASSWORD` values and ensure the App Password is used.
- Check logs for `Senha configurada: SIM` and `JavaMailSender available: SIM` on startup.
- For production, use a dedicated transactional email provider (SendGrid, Mailgun, Amazon SES) and store credentials in a secrets manager.
