# email-investigation-portal
Mailbox-style investigation portal built using the PERN stack (PostgreSQL, Express.js, React.js, and Node.js).
# Email Investigation Portal

## 1. Project Overview

We are building an interactive, email-style investigation portal using the PERN stack.

Players will investigate a fictional case by exploring emails, documents, evidence and hints. The website will act as a digital evidence repository that guides players through the investigation without revealing the final conclusion immediately.

## 2. Technology Stack

- **Frontend:** React
- **Backend:** Node.js and Express.js
- **Database:** PostgreSQL
- **Version Control:** GitHub

## 3. Core Features

### A. Authentication
- Login using google auth.
- Associate each investigation group with its designated bits mail.
- Track hint access for each group.

### B. Email Repository
- Inbox, Sent, Drafts and Trash sections.
- Pre-written emails displayed in a mailbox-style interface.
- Clicking an email opens its individual detail page.
- Email content and evidence must remain consistent with the investigation case document.

### C. Hints System
- Hints are locked by default.
- Players can open a hints menu and select an available hint.
- Each hint has a separate detail page.
- Track which group accesses each hint.
- Limit each mail/group to a maximum of five hints, according to the agreed project rules.

### D. Administration and Tracking
- Record hint-access activity.
- Enforce the hint limit on the backend.
- Provide appropriate administrative access to relevant tracking information.

## 4. Team Responsibilities

 Member 1 Mailbox interface and folders 

 Member 2 Email detail pages and evidence presentation

 Member 3  Hints interface and hint detail pages

 Member 4 google auth authentication

 Member 5 PostgreSQL database and hint tracking

## 5. Initial Project Structure

The agreed structure will be:

```text
email-investigation-portal/
├── client/       # React frontend
├── server/       # Node.js and Express backend
├── database/     # PostgreSQL schema and setup
├── .gitignore
├── .env.example
└── README.md
```
