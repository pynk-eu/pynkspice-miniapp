# The PynkSpice Mini App

This Next.js app displays a vegetarian menu and lets users place orders.

## Google Sheets integration

You can populate the menu via a published Google Sheet (as CSV) and send orders to a Google Apps Script Web App or any webhook.

### Environment variables
Create a `.env.local` in the project root:

```
# Published Google Sheet CSV export URL for the menu
MENU_SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/.../pub?output=csv"

# Webhook endpoint (e.g., Google Apps Script deployed as a Web App) to receive orders
ORDERS_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"

# Optional: Published Google Sheet CSV for UI translations
# Expected columns: key,en,de
I18N_SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
```

- For menu: In Google Sheets, File → Share → Publish to the web → Link → CSV, copy the generated URL.
- For orders: Build a simple Apps Script that appends incoming JSON to a sheet and deploy it as a Web App (Execute as: Me; Who has access: Anyone). Use the deployed URL.

### Data shape
The menu CSV should have a header row with these columns:

```
id,name_en,name_de,description_en,description_de,ingredients_en,ingredients_de,max_quantity,price,image_urls
```
- ingredients and allergies can be comma-separated lists.

### Local fallback
If `MENU_SHEET_CSV_URL` is missing or fails, the app falls back to the built-in sample menu.

## Develop

```
npm run dev
```

## Build

```
npm run build
```
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
