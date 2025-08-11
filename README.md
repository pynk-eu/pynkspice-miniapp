
PynkSpice Telegram Mini App - v1
--------------------------------

Files:
- index.html
- style.css
- helpers.js   (contains CONFIG with your CSV links)
- app.js       (main app logic)
- apps_script_example.txt  (Google Apps Script to enable review posting)
- README.md  (this file)

What I did:
- Integrated your provided CSV URLs directly into helpers.js (MENU_CSV, REVIEWS_CSV, TRANSLATIONS_CSV).
- Implemented EN/DE language support by reading translations CSV (expected columns: key,en,de).
- Menu cards show image, name, quantity and price, plus Add to Cart & Buy Now.
- Clicking a card opens details page with description & ingredients.
- Reviews are shown and there's a form to submit reviews. Review POST requires deploying the included Apps Script example.

Required manual steps before deploying on Vercel (or any static host):
1) OPTIONAL but recommended: Update CONFIG.REVIEW_POST_URL in helpers.js with the Web App URL from your deployed Apps Script (see apps_script_example.txt).
2) Deploy the folder as a static site (Vercel, Netlify, GitHub Pages, etc.).
3) In BotFather, create a message with an Inline Keyboard Web App button pointing to the deployed URL to allow users to open the app inside Telegram.

Notes:
- Orders use Telegram.WebApp.sendData to send order payload back to your bot. Your bot must handle incoming WebAppData to record/process orders.
- Reviews posting requires the Google Apps Script web app to append rows to your Reviews sheet (instructions included).
- The app uses PapaParse (CDN) to parse CSVs. Make sure the published CSV URLs remain public.

If you want, I can:
- Help deploy this to Vercel and connect it to your bot (I cannot deploy to your Vercel account, but I can deploy under my account and give you the URL, or provide exact Vercel steps).
- Generate the exact bot-side handler (Node.js or Python) to receive WebAppData and confirm orders.
- Deploy the Apps Script for you if you give me access to the Google account (not recommended).
