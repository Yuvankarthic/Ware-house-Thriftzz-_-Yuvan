import os
import json
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_mail import Mail
from config import Config, INVOICE_DIR, LOG_DIR
from modules.webhook import RazorpayWebhookHandler
from modules.invoice import InvoiceGenerator
from modules.mailer import InvoiceMailer

# Setup Logging
logging.basicConfig(
    filename=LOG_DIR / "app.log",
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)

app = Flask(__name__)
app.config.from_object(Config)

mail = Mail(app)

# Initialize Modules
webhook_handler = RazorpayWebhookHandler(
    app.config['RAZORPAY_KEY_ID'], 
    app.config['RAZORPAY_KEY_SECRET'], 
    app.config['RAZORPAY_WEBHOOK_SECRET']
)
invoice_generator = InvoiceGenerator(app.config['COMPANY'])
mailer = InvoiceMailer(mail)

@app.route('/webhook/razorpay', methods=['POST'])
def handle_razorpay_webhook():
    """Main webhook listener for payment.captured event."""
    payload = request.get_data(as_text=True)
    signature = request.headers.get('X-Razorpay-Signature')

    # 1. Verify Signature
    if not webhook_handler.verify(payload, signature):
        app.logger.warning(f"Invalid signature attempt from {request.remote_addr}")
        return jsonify({'status': 'invalid signature'}), 400

    # 2. Extract Event Data
    event_data = request.json
    order_details = webhook_handler.extract_order_details(event_data)

    if not order_details:
        return jsonify({'status': 'event ignored'}), 200

    # 3. Generate Invoice
    try:
        app.logger.info(f"Generating invoice for Order {order_details['order_id']}")
        pdf_path, pdf_filename = invoice_generator.create_invoice(order_details)
        
        # 4. Send Email
        success = mailer.send_invoice(
            order_details['customer_email'],
            pdf_path,
            pdf_filename,
            order_details['order_id'],
            app.config['COMPANY']['name']
        )
        
        if success:
            app.logger.info(f"Invoice sent to {order_details['customer_email']}")
        else:
            app.logger.error(f"Failed to send invoice for Order {order_details['order_id']}")

        return jsonify({'status': 'success', 'order_id': order_details['order_id']}), 200

    except Exception as e:
        app.logger.error(f"Error processing webhook: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/invoices/<filename>')
def serve_invoice(filename):
    """Utility to view generated invoices locally."""
    return send_from_directory(INVOICE_DIR, filename)

if __name__ == '__main__':
    print(f"Server starting on port {app.config['PORT']}...")
    app.run(port=app.config['PORT'], debug=app.config['DEBUG'])
