Flores Family Meals v6

Long-term architecture:
- index.html: current week only
- monday.html through sunday.html: current-week static recipe pages for reliable AnyList import
- recipes.html: searchable Recipe Library + Dinner History
- recipes/<id>.html: stable permanent recipe URLs
- data/meals.json: current week
- data/recipes.json: permanent recipe database
- data/history.json: dated dinner history
- library.js: search/filter/history interface
- app.js: cooking mode, timer, AnyList

For future weeks: preserve recipes.json and history.json, add new recipes only once, append the completed/current week to history.json, and replace meals.json plus weekday pages.

V7: Adds per-step photography in focused cooking mode and All Steps. HelloFresh recipes use externally hosted HelloFresh step imagery; other recipes use representative Unsplash photography with visible source credit.


v8: Adds 1-5 star local ratings and rating filter, confetti completion with scroll-to-top, and a minimized-by-default floating expandable timer. Ratings are stored in localStorage on each browser/device.


v9: Adds a sticky All Steps / Cooking Mode switcher after the top recipe controls scroll away, plus extra iPhone safe-area/bottom clearance so the minimized timer cannot cover Previous/Next/Done controls.

V10: Weekly cards distinguish Planned, Cooked, and Skipped using local browser storage. Recipe library Made/Last Made counts only meals explicitly marked Cooked.
