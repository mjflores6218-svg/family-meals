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

PHASE 1 / SUPABASE
The browser uses cloud.js with the public Supabase project URL and publishable key. No service-role secret is included.
Because this Supabase project was created with automatic Data API exposure disabled, run these grants after RLS/policies are configured:
  grant select on public.households to authenticated;
  grant select, insert, update, delete on public.meal_status to authenticated;
  grant select, insert, update, delete on public.recipe_ratings to authenticated;
The household membership helper function must remain executable by authenticated users.
Guests can browse/cook without signing in; signed-in household members sync statuses and ratings.


v12.2 cache hardening:
- All local CSS/JS references carry ?v=12.2.
- Internal page navigation carries ?v=12.2.
- Recipe/history JSON fetches use cache:no-store plus a version query.
- HTML includes no-cache meta directives as a client-side safeguard.
- This Week and Recipes pages show a subtle v12.2 marker for deployment diagnostics.
Note: GitHub Pages/CDN may still briefly serve a previous root index.html immediately after deployment; client code cannot override an already-cached document before it loads. The version marker makes this obvious.


v12.8: authentication-independent iOS scroll-boundary guard. Recipe pages clamp stale dynamic-toolbar scroll offsets on scroll/resize/pageshow/visualViewport changes for guests and signed-in users alike.


v13.0 weekly update: Aug 31-Sep 6, 2026 real-world plan; Morgan Meal tag added; Benihana dinner date.
