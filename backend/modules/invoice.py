import os
import secrets
from datetime import datetime
from weasyprint import HTML
from flask import render_template
from config import Config, INVOICE_DIR

class InvoiceGenerator:
    def __init__(self, company_config):
        self.company = company_config
        self.prefix = self.company.get("invoice_prefix", "WHT")
        self.currency = self.company.get("currency_symbol", "₹")

    def get_existing_invoice(self, order_id):
        """Prevents duplicate generation by checking if file exists."""
        filename = f"invoice_{order_id}.pdf"
        file_path = os.path.join(INVOICE_DIR, filename)
        return (file_path, filename) if os.path.exists(file_path) else (None, None)

    def create_invoice(self, order_data):
        # 1. Check for Duplicate
        existing_path, existing_filename = self.get_existing_invoice(order_data['order_id'])
        if existing_path:
            return existing_path, existing_filename

        # 2. Add Metadata
        order_data['invoice_number'] = f"{self.prefix}-{datetime.now().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"
        order_data['company'] = self.company
        order_data['date'] = datetime.now().strftime("%d %b %Y")
        order_data['currency'] = self.currency

        # 3. Render HTML
        html_content = render_template('invoice.html', **order_data)
        pdf_filename = f"invoice_{order_data['order_id']}.pdf"
        pdf_path = os.path.join(INVOICE_DIR, pdf_filename)
        
        HTML(string=html_content).write_pdf(pdf_path)
        return pdf_path, pdf_filename
