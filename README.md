Thunder Bird — GST Invoice & Billing System

Thunder Bird is a complete **GST-compliant Invoice & Billing Web Application** built using Flask.
It is designed for **small businesses, freelancers, and service providers in India** to manage clients, items, and invoices efficiently.

---
🚀 Features

🔐 Authentication System

* Custom user registration (username, email, phone)
* Secure login with password hashing (Werkzeug)
* Session management using Flask-Login
* Forgot password via OTP (phone-based verification)

---

📊 Dashboard

* Total outstanding amount
* Overdue invoices count
* Recent invoices overview

---

👥 Client Management

* Add, edit, delete clients
* Store GSTIN, address, contact details

---

📦 Item Management

* Manage products/services
* HSN code support
* Default GST % (18%)

---

🧾 Invoice System

* Generate GST-compliant invoices
* Auto invoice number (e.g., TB-2026-0001)
* Dynamic line items (add/remove rows)
* Automatic calculation:

  * Subtotal
  * GST (CGST + SGST split)
  * Grand total
* Payment status tracking:

  * Unpaid / Partial / Paid

---

📄 PDF Generation

* Download invoices as professional PDF
* GST breakdown included
* Clean printable format

---

🔁 Password Reset (OTP Based)

* Enter registered phone number
* 6-digit OTP verification
* Reset password securely

---

🛠️ Tech Stack

* **Backend:** Flask
* **Database:** SQLite (Flask-SQLAlchemy)
* **Authentication:** Flask-Login
* **Frontend:** Bootstrap 5
* **PDF Generation:** WeasyPrint
* **Environment Config:** python-dotenv

---

📁 Project Structure

Thunder-Bird/
│── app.py
│── models.py
│── instance/
│   └── billing.db
│── templates/
│── static/
│── .env

---

⚙️ Installation & Setup

 1. Clone the repository

git clone https://github.com/lakshya13paliwal/Thunder-Bird.git
cd Thunder-Bird

 2. Install dependencies

pip install -r requirements.txt

 3. Set environment variables

Create a `.env` file:
SECRET_KEY=your_secret_key_here

 4. Run the application

python app.py

App runs on:
http://0.0.0.0:5000

---

🇮🇳 GST Compliance Features

* GSTIN support
* CGST + SGST split calculation
* HSN codes for items
* Indian invoice formatting

---

 👨‍💻 Author

Lakshya Paliwal

---

 ⭐ Support

If you like this project, give it a ⭐ on GitHub!
