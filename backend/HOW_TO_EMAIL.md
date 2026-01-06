# How to Configure Gmail for DermaKart

To send emails (order confirmations, admin alerts), this application uses Gmail. Google requires a special "App Password" for security. You cannot use your normal login password.

## Step 1: Enable 2-Step Verification (If not already done)
1. Go to your [Google Account Settings](https://myaccount.google.com/).
2. Click on **Security** on the left.
3. Under "How you sign in to Google", turn on **2-Step Verification**.

## Step 2: Generate an App Password
1. Go back to the **Security** page.
2. Under "How you sign in to Google", type "App passwords" in the search bar at the top (or look for it in the list).
3. Click **App passwords**.
4. You may be asked to sign in again.
5. In the "App name" field, type **DermaKart Backend**.
6. Click **Create**.
7. Google will show you a 16-character password (e.g., `abcd efgh ijkl mnop`). **Copy this password.**

## Step 3: Update `.env` File
Open the `.env` file in this folder and update it like this:

```env
# ... existing database config ...

# EMAIL CONFIGURATION
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# 1. Put YOUR full Gmail address here:
SMTP_USER=bhavnapatil014@gmail.com

# 2. Put the 16-character APP PASSWORD you just copied here (no spaces):
SMTP_PASS=abcdefghijklmnop

# 3. Just a label for the emails:
SMTP_FROM="DermaKart <bhavnapatil014@gmail.com>"
```

## Step 4: Restart Backend
After saving the `.env` file, go to your terminal where the backend is running.
1. Press `Ctrl + C` to stop it.
2. Run `npm run dev` (or `node server.js`) to start it again.

## Step 5: Test It
Visit: `http://localhost:4000/api/auth/test-email`
If it says "Email Sent Successfully", you are done!
