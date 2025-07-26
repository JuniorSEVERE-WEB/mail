# Mail - Single Page Application

A web-based email client built with Django and vanilla JavaScript, allowing users to send, receive, archive, and reply to emails in a modern Single Page Application (SPA) interface.

## 🚀 Features

- **Send Emails**: Compose and send emails to other users
- **Inbox**: View all received emails
- **Sent Mail**: View history of sent emails
- **Archive**: Archive and unarchive important emails
- **Reply**: Reply directly to received emails
- **Mark as Read**: Emails are automatically marked as read when viewed
- **Responsive Interface**: Modern and adaptive design

## 🛠️ Technologies Used

- **Backend**: Django 4.x, Python 3.x
- **Frontend**: JavaScript ES6+, HTML5, CSS3, Bootstrap
- **Database**: SQLite (development)
- **API**: Django REST Framework (JSON endpoints)

## 📋 Prerequisites

- Python 3.8+
- Django 4.0+
- A modern browser supporting ES6+

## 🔧 Installation

### 1. Clone the project
```bash
git clone https://github.com/YOUR_USERNAME/mail-project.git
cd mail-project
```

### 2. Create a virtual environment (optional but recommended)
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install django
```

### 4. Apply migrations
```bash
python manage.py makemigrations mail
python manage.py migrate
```

### 5. Create a superuser
```bash
python manage.py createsuperuser
```

### 6. Run the development server
```bash
python manage.py runserver
```

The application will be accessible at `http://127.0.0.1:8000/`

## 📖 Usage

### User Interface

1. **Login**: Sign in with your user account
2. **Navigation**: Use buttons to navigate between:
   - **Inbox**: Received emails
   - **Sent**: Sent emails
   - **Archived**: Archived emails
   - **Compose**: Compose a new email

### Main Features

#### Compose an Email
- Click "Compose"
- Fill in recipient, subject, and body
- Click "Send"

#### View an Email
- Click on an email in your inbox
- The email opens with all information
- It's automatically marked as read

#### Reply to an Email
- Open a received email
- Click "Reply"
- The form auto-fills with:
  - Recipient (original sender)
  - Subject with "Re: "
  - Quote of the original message

#### Archive/Unarchive
- Open a received email (not sent)
- Click "Archive" or "Unarchive"
- The email status changes and you return to the inbox

## 🏗️ Project Structure

```
mail/
├── mail/
│   ├── __init__.py
│   ├── admin.py          # Admin interface configuration
│   ├── models.py         # User and Email models
│   ├── urls.py           # Application URLs
│   ├── views.py          # Views and API endpoints
│   └── migrations/       # Migration files
├── static/mail/
│   └── inbox.js          # JavaScript SPA logic
├── templates/mail/
│   ├── inbox.html        # Main template
│   ├── layout.html       # Base template
│   ├── login.html        # Login page
│   └── register.html     # Registration page
├── manage.py
└── db.sqlite3           # SQLite database
```

## 🔌 API Endpoints

- `GET /emails/<str:mailbox>`: Get emails from a mailbox
- `GET /emails/<int:email_id>`: Get a specific email
- `POST /emails`: Send a new email
- `PUT /emails/<int:email_id>`: Update an email (read/archived)

## 🎨 Admin Interface

Access the Django admin interface at `http://127.0.0.1:8000/admin/` to:
- Manage users
- View and modify emails
- Administer application data

## 🚀 Technical Features

### Single Page Application
- Navigation without page reload
- JavaScript view management
- Dynamic content updates

### Security
- CSRF protection for forms
- Required user authentication
- Server-side data validation

### Performance
- Asynchronous email loading
- View caching
- Optimized database queries

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 👨‍💻 Author

**Your Name** - [https://github.com/JuniorSEVERE-WEB/)

## 🙏 Acknowledgments

- CS50's Web Programming with Python and JavaScript
- Django Documentation
- Bootstrap for CSS framework
