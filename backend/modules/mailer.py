from flask_mail import Mail, Message
from flask import current_app

class InvoiceMailer:
    def __init__(self, mail_instance):
        self.mail = mail_instance

    def send_invoice(self, customer_email, pdf_path, pdf_filename, order_id, company_name):
        """Sends the invoice PDF as an attachment."""
        try:
            msg = Message(
                subject=f"Order Confirmation - {company_name} (Order #{order_id})",
                recipients=[customer_email],
                body=f"Thank you for your purchase from {company_name}! Please find your invoice attached."
            )

            with open(pdf_path, 'rb') as fp:
                msg.attach(pdf_filename, "application/pdf", fp.read())

            self.mail.send(msg)
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
