import json
import razorpay
from flask import current_app

class RazorpayWebhookHandler:
    def __init__(self, key_id, key_secret, webhook_secret):
        self.client = razorpay.Client(auth=(key_id, key_secret))
        self.webhook_secret = webhook_secret

    def verify(self, payload, signature):
        """Verifies the webhook signature."""
        try:
            self.client.utility.verify_webhook_signature(payload, signature, self.webhook_secret)
            return True
        except Exception as e:
            current_app.logger.error(f"Webhook Signature Verification Failed: {e}")
            return False

    def extract_order_details(self, event_data):
        """Extracts and formats data for invoice generation."""
        event = event_data.get('event')
        
        if event != 'payment.captured':
            return None

        payment_entity = event_data['payload']['payment']['entity']
        
        # Razorpay amount is in paise, convert to currency
        amount = payment_entity.get('amount', 0) / 100
        
        # Get notes for extra info (customer name, items)
        notes = payment_entity.get('notes', {})
        
        try:
            items_list = json.loads(notes.get('items', '[]'))
        except json.JSONDecodeError:
            items_list = []

        return {
            'order_id': payment_entity.get('order_id'),
            'payment_id': payment_entity.get('id'),
            'customer_name': notes.get('customer_name', 'Valued Customer'),
            'customer_email': payment_entity.get('email'),
            'customer_phone': payment_entity.get('contact'),
            'total_amount': f"{amount:,.2f}",
            'items': items_list,
            'payment_status': 'PAID'
        }
