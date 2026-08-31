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
