# Authentication & Login HTML Pages

This directory contains standalone, production-ready HTML templates designed for login, user onboarding, and authentication workflows in the **RECONSTRUCT Evidence Recreation Engine**.

---

## 📁 Directory Contents

| File | Purpose | Key Features |
| :--- | :--- | :--- |
| **`login.html`** | Main Investigator Sign-In page | Username/email, password with toggle, "Remember device", PIV/CAC & Security Key SSO buttons. |
| **`register.html`** | Access Request / Account Registration | Name, email, role selection dropdown, password strength meter, terms checkbox. |
| **`forgot-password.html`** | Password Recovery Request | Work email entry, validation, success notification banner. |
| **`reset-password.html`** | New Password Setup | Password criteria checklist (min length, uppercase, numbers, special chars). |
| **`two-factor.html`** | 2FA / OTP Verification | 6-digit PIN input with auto-tabbing, clipboard paste handler, countdown timer. |
| **`logout.html`** | Session Termination Notice | Audit log confirmation, security cache flush message, re-login link. |

---

## 🎨 Design System & Color Palette (Red & Black Cybernetic Theme)
- **Background Primary**: `#090304` (Deep Pitch Black with subtle warm tint)
- **Card Background**: `#14090b` (Dark Crimson Black container)
- **Input Background**: `#1f0e11` (Deep dark red container)
- **Borders**: `#3b161b` (Crimson border accents)
- **Primary Accent**: `#ff2a4b` & `#dc2626` (Electric Crimson / Radiant Red buttons, glowing borders, active rings, and branding)
- **Hover Accent**: `#ff4d6d`
- **Typography**: Google Fonts — **Inter** for UI copy & **JetBrains Mono** for brand headers and security codes.

---

## 🚀 Serving via Frontend Dev Server / Vite

To serve these HTML files directly through the frontend workspace (e.g. at `http://localhost:5173/auth/login.html`), copies of these files are located at:

```
packages/frontend/public/auth/
├── login.html
├── register.html
├── forgot-password.html
├── reset-password.html
├── two-factor.html
└── logout.html
```

---

## 🔌 API Integration Endpoints

When connecting these HTML templates to backend API controllers:

- `POST /api/auth/login` — Body: `{ username, password, rememberMe }`
- `POST /api/auth/register` — Body: `{ fullname, email, role, password }`
- `POST /api/auth/forgot-password` — Body: `{ email }`
- `POST /api/auth/reset-password` — Body: `{ token, newPassword }`
- `POST /api/auth/verify-2fa` — Body: `{ code }`
- `POST /api/auth/logout` — Revokes session JWT / cookie.
