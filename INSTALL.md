# Putting little steps on your iPhone

You only need to do this once. Afterwards the app lives on your home screen, works offline,
and keeps all your data on your phone. Your laptop never has to be on.

## 1. Put the folder online (free, ~3 minutes, done from your laptop once)

**Easiest: Netlify Drop**
1. Go to https://app.netlify.com/drop
2. Drag this whole `little-steps` folder onto the page.
3. Make a free account when it asks (otherwise the link expires after an hour).
4. You get a link like `https://something-cute-123.netlify.app`. You can rename it in Site settings.

**Or: GitHub Pages**
1. Make a new public repo, upload every file in this folder.
2. Settings → Pages → Branch: `main` → Save.
3. Your link is `https://YOURNAME.github.io/REPONAME/`.

Netlify or GitHub just hand the files to your phone the first time. After that the app runs
entirely on your iPhone, even with no internet.

## 2. Install on iPhone
1. Open the link in **Safari** (it has to be Safari).
2. Tap the **Share** button (square with the arrow) → **Add to Home Screen** → Add.
3. Open it from your home screen. It runs full-screen, like any other app.

## 3. Turn on reminders for when the app is closed
iPhone doesn't let web apps buzz you in the background without a server, so the app uses your
iPhone's own **Calendar alarms** instead:
- In the app: ⚙️ Settings → **Add reminders to Calendar**
  (if that doesn't open Calendar, use **Share .ics file** → save to Files → tap the file).
- This adds your due tasks, important dates, and 3 daily check-ins from your buddy, all with real alerts.
- After you add new tasks, add them to Calendar again. Tip: import into a separate calendar named
  "little steps" so you can delete it and re-import cleanly.

When the app is open, your buddy checks in every 45 minutes (you can change that) and asks how
your most urgent task is going. Answer "I'm X% done" and pick how long to be left alone.

## 4. Optional: catch doom-scrolling
Shortcuts app → Automation → **+** → App → choose TikTok/Instagram → "Is Opened" → Run Immediately →
add **Show Notification**: "Mochi misses you… still on TikTok? 🥺"

## Updating the app
Drag the updated folder onto your Netlify site's Deploys page (or re-upload to GitHub).
The app picks up the new version the next time it opens with internet. Your data stays.

## Backups
Your data is stored only on your phone. ⚙️ Settings → **Save a backup file** now and then.
