# Ajeer Permit System (Node.js + Express + MongoDB + Puppeteer)

Form fill karo → data MongoDB me save hota hai → ek styled PDF (sample jaisa) generate hoti
hai jisme top par QR code hota hai → QR scan karne par `/verify/:id` page open hota hai
jo permit details dikhata hai.

## Project Structure
```
ajeer-permit-system/
├── server.js                 # Express app entry point
├── models/Permit.js          # Mongoose schema
├── routes/permitRoutes.js    # /api/permits endpoints
├── utils/pdfGenerator.js     # QR + Puppeteer -> PDF
├── templates/permitTemplate.js # HTML layout used for the PDF
├── public/
│   ├── index.html            # The form
│   ├── verify.html           # Page shown after QR scan
│   ├── style.css
│   └── script.js
└── .env.example
```

## 1. Setup

```bash
cd ajeer-permit-system
npm install
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/ajeer_permits
PORT=3000
BASE_URL=https://crm.pakistanrecoveryoasis.com
```

**`BASE_URL` sabse important hai** — yehi wo domain hai jo QR code me encode hoga.
Jab tak ye aapka real public domain nahi hoga, phone se scan karne par website open nahi hogi.
Agar aap `crm.pakistanrecoveryoasis.com` par is app ko deploy kar rahe hain, to wahi yahan daalein.

## 2. Run locally
```bash
npm start
```
Then open `http://localhost:3000` — form yahin milega.

## 3. Deploying on cPanel (matches your screenshot)

1. cPanel me **"Setup Node.js App"** tool use karke ek Node.js app banayein (subdomain:
   `crm.pakistanrecoveryoasis.com`, document root already shown in your panel).
2. Project files upload karein (ya git se clone), phir cPanel Node.js interface se
   `npm install` chalayein.
3. `.env` file me `MONGO_URI` (MongoDB Atlas ya server-hosted Mongo) aur
   `BASE_URL=https://crm.pakistanrecoveryoasis.com` set karein.
4. **Puppeteer note:** Puppeteer apne saath ek Chromium download karta hai. Shared cPanel
   hosting me kabhi kabhi ye download/permissions block ho sakta hai. Agar aisa ho:
   - `npm install puppeteer-core` use karein aur server par pehle se installed Chrome/Chromium
     ka path `executablePath` me dein (`utils/pdfGenerator.js` me), ya
   - VPS / Node-friendly hosting use karein jahan Puppeteer normally chal sake.
5. App start karein — cPanel Node.js panel "Start App" button dega.

## 4. How the QR flow works

- Form submit → `POST /api/permits` → MongoDB me record save hota hai (`_id` milta hai)
- Us `_id` se ek verify link banta hai: `${BASE_URL}/verify/<id>`
- Ye link QR code me encode hoke PDF ke top par print hota hai
- PDF turant download ho jati hai
- Jab koi is QR ko scan karta hai → `crm.pakistanrecoveryoasis.com/verify/<id>` open hota
  hai → `verify.html` us permit ka live data MongoDB se fetch karke dikhata hai (valid /
  expired status ke saath)

## 5. Re-downloading an existing permit's PDF
```
GET /api/permits/:id/pdf
```
