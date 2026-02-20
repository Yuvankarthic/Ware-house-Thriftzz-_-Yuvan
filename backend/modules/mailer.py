import os
from flask_mail import Mail, Message
from flask import current_app

class InvoiceMailer:
    def __init__(self, mail_instance):
        self.mail = mail_instance

    def send_invoice(self, customer_email, pdf_path, pdf_filename, order_id, company_name):
        """Sends the invoice PDF as an attachment."""
        try:
            # 1. Verify file exists
            if not os.path.exists(pdf_path):
                current_app.logger.error(f"PDF not found at {pdf_path}. Cannot attach to email.")
                return False

            # 2. Prepare message
            msg = Message(
                subject=f"Order Confirmation - {company_name} (Order #{order_id})",
                recipients=[customer_email],
                body=f"Thank you for your purchase from {company_name}! Please find your invoice attached."
            )

            # 3. Read and attach file
            with open(pdf_path, 'rb') as fp:
                msg.attach(
                    filename=pdf_filename,
                    content_type="application/pdf",
                    data=fp.read()
                )

            # 4. Send
            self.mail.send(msg)
            current_app.logger.info(f"Email with attachment sent successfully to {customer_email}")
            return True
        except Exception as e:
            current_app.logger.error(f"Failed to send email with attachment: {e}")
            return False
