import os
import secrets
from datetime import datetime
from weasyprint import HTML
from flask import render_template
from config import Config, INVOICE_DIR

class InvoiceGenerator:
    def __init__(self, company_config):
        self.company = company_config
        self.prefix = self.company.get("invoice_prefix", "INV")
        self.currency = self.company.get("currency_symbol", "₹")

    def generate_number(self):
        """Generates a unique invoice number."""
        date_str = datetime.now().strftime("%Y%m%d")
        unique_suffix = secrets.token_hex(3).upper()
        return f"{self.prefix}-{date_str}-{unique_suffix}"

    def get_existing_invoice(self, order_id):
        """Returns path if invoice already exists for the order ID."""
        filename = f"invoice_{order_id}.pdf"
        file_path = os.path.join(INVOICE_DIR, filename)
        if os.path.exists(file_path):
            return file_path, filename
        return None, None

    def create_invoice(self, order_data):
        """Renders HTML and converts to PDF."""
        # 1. Check for duplicate
        existing_path, existing_filename = self.get_existing_invoice(order_data['order_id'])
        if existing_path:
            return existing_path, existing_filename

        # 2. Add metadata
        order_data['invoice_number'] = self.generate_number()
        order_data['company'] = self.company
        order_data['date'] = datetime.now().strftime("%d %b %Y")
        order_data['currency'] = self.currency

        # 3. Render HTML
        # In a modular setup, we can't use flask's global render_template 
        # outside of context, but since this will be called from app.py (during request), it works.
        html_content = render_template('invoice.html', **order_data)

        # 4. Generate PDF
        pdf_filename = f"invoice_{order_data['order_id']}.pdf"
        pdf_path = os.path.join(INVOICE_DIR, pdf_filename)
        
        # Save PDF
        HTML(string=html_content).write_pdf(pdf_path)
        
        return pdf_path, pdf_filename
