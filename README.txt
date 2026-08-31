Flores Family Meals v11 — hardened baseline

Canonical data:
- data/recipes.json: permanent recipe definitions and metadata.
- data/meals.json: current week's schedule. Recipe slots should reference a recipe slug/id; dinner dates are event records.
- data/history.json: immutable planned-week snapshots, including full Dinner Date metadata.

Generated/static surfaces:
- monday.html ... sunday.html are current-week static recipe/event pages used for reliable Recipe structured metadata and AnyList importing.
- recipes/*.html are permanent static recipe pages.
- Keep generated HTML synchronized with data/recipes.json when recipe content changes.

Local state (until shared persistence is added):
- Ratings: ffm-rating-<recipeId>
- Meal status: ffm-meal-status-<YYYY-MM-DD>-<recipeId/eventId>
- Kitchen timer: ffm-kitchen-timer-v11

v11 hardening:
- Timestamp-based persistent timer, resilient to iPhone background throttling and page navigation.
- Accessible modal behavior, Escape close, focus restoration, timer completion announcement.
- Optional post-cooking prompt to mark the scheduled weekday meal Cooked.
- Recipe Library sorting: highest rated, quickest, lowest calories, most cooked, least recently cooked, A-Z.
- Dinner Date history stores a complete restaurant snapshot.
- Versioned CSS/JS references to avoid stale Safari caches.
- JS organized by feature instead of runtime function overrides.
