# Dayline

A dashboard for managing multiple social media accounts, with a daily post-ideas calendar for each account.

**Stack:** HTML, CSS, vanilla JavaScript (ES modules), Firebase Firestore

## Features

- Home page with a grid of all your accounts (name, niche, followers).
- Per-account page with the account details and a monthly calendar of post ideas.
- Each idea stores a title, description, generation prompt, type (image or video), keywords and music.
- Bulk-import a whole month of ideas from a CSV file.

## Project structure

```
index.html         Home: accounts grid
account.html       Account page: details and calendar
css/shared.css     Shared colors, buttons and modal styles
css/account.css    Account page styles
js/home.js         Home page logic
js/index.js        Home page entry
js/account.js      Account page logic
js/firebase.js     Data layer (Firestore)
demo/              Sample accounts and a sample ideas CSV
firestore.rules    Firestore security rules
```

## Running locally

The project uses ES modules, so it must be served over HTTP (opening the file directly will not work):

```bash
npx serve .
# or
python3 -m http.server
```

Then open the printed local address in your browser.

## Data layer (`js/firebase.js`)

| Function | Purpose |
|---|---|
| `getAccounts()` | List all accounts |
| `addAccount(data)` | Add an account and return its id |
| `getAccount(id)` | Get one account |
| `updateFollowers(id, n)` | Update the follower count |
| `getIdeas(id, "YYYY-MM")` | Get a month of ideas, keyed by date |
| `saveIdea(id, idea)` | Create or update the idea for a day |
| `importIdeasCSV(id, rows)` | Import a whole month at once |

## Data model

```
accounts/{id}: name, url, username, password, niche, followers, createdAt
accounts/{id}/ideas/{YYYY-MM-DD}: date, title, description, prompt, type (image|video), keywords, music
```

## CSV format

```
date,title,description,prompt,type,keywords,music
2026-11-01,Idea 1,Description...,Prompt...,video,"keyword1, keyword2",Song name
```

A ready-to-use example is in `demo/sample-ideas-2026-11.csv`.

## Firebase setup

1. Create a Firebase project and a Firestore database.
2. Put your web app config in `js/firebase.js` and your project id in `.firebaserc`.
3. Deploy the rules: `firebase deploy --only firestore:rules` (or paste `firestore.rules` into Console → Firestore → Rules).

## Security warning

There is no authentication. With the current open rules, anyone who knows the Firebase config (it is visible in the site's code) can read and write the data, including stored account passwords. Add sign-in and tighten `firestore.rules` before using this with real accounts.
