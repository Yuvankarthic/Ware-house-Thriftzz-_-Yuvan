# WHT Fashion - Backend (Modular Production Ready)

A production-ready Flask backend that handles Razorpay webhooks, generates professional PDF invoices with a unique numbering system, and sends automated emails.

## 📁 Structure
- `app.py`: Main entry point.
- `config.py`: Configuration and environment loader.
- `config.yaml`: Company details and currency settings.
- `modules/`: Contains separate logic for webhooks, invoices, and mailing.
- `templates/`: HTML templates for the invoice.
- `invoices/`: Storage for generated PDFs (auto-created).
- `logs/`: Application logs (auto-created).

## 🚀 Setup Instructions

### 1. Install Python Dependencies
Open your terminal in the `backend/` directory:
```bash
pip install -r requirements.txt
```
*Note: On Windows, WeasyPrint might need the GTK+ runtime for PDF generation. Check [WeasyPrint docs](https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#windows) if you face issues.*

### 2. Configure Environment
Copy `.env.example` to `.env` and update the following:
- `SECRET_KEY`: Random string.
- `RAZORPAY_KEY_ID`: From Razorpay dashboard.
- `RAZORPAY_KEY_SECRET`: From Razorpay dashboard.
- `RAZORPAY_WEBHOOK_SECRET`: Your own secret for webhook security.
- `MAIL_USERNAME` / `MAIL_PASSWORD`: Your SMTP credentials (for Gmail, use App Passwords).

### 3. Customize Company Info
Edit `config.yaml` to change company name, address, or currency symbols.

### 4. Run the Server
```bash
python app.py
```

## 🧪 How to Test Webhook Locally

Since webhooks require a public URL, you can use **ngrok**:

1. **Install ngrok:** Download from [ngrok.com](https://ngrok.com/).
2. **Expose Flask Port:**
   ```bash
   ngrok http 5000
   ```
3. **Copy the Forwarding URL:** e.g., `https://XXXX-XXX-XXX.ngrok.io`.
4. **Update Razorpay Dashboard:**
   - Webhook URL: `https://XXXX-XXX-XXX.ngrok.io/webhook/razorpay`.
   - Secret: Matches `RAZORPAY_WEBHOOK_SECRET`.
   - Event: `payment.captured`.
5. **Simulate a Payment:** Use Razorpay's "Test Mode" to make a dummy payment.

### Alternative: Direct Manual Test (using Curl/Postman)
You can send the `test_payload.json` content to `localhost:5000/webhook/razorpay` but note that **it will fail signature verification** unless you bypass the verification logic temporarily or compute a valid signature manually using your webhook secret.

To bypass verification for a quick local test (NOT IN PRODUCTION):
In `modules/webhook.py`, make `verify` return `True` temporarily.
