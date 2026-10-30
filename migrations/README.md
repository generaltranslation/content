# AEO retirement handoff

`aeo-to-kb.json` records the proposed destination of every article in the
58-record published AEO inventory retrieved on October 30, 2026. It is a review
artifact, not active routing configuration. Merging this content change does not
disable the hosted AEO section or install redirects.

## Content to preserve

- **New:** `/kb/translation-pricing-without-seat-fees` combines the usage-pricing
  and seat-cost articles. It retains their useful buying question, compares roles
  and billing units using current primary sources, and uses a hypothetical
  workload instead of a volatile dollar estimate.
- **Updated:** `/kb/review-translations` incorporates the local-edit workflow:
  save corrections back to the platform, retrieve saved Dashboard edits, and
  distinguish those operations from generating new translations.
- **Updated:** `/kb/translate-markdown-files` incorporates a compact example of
  display text versus machine identifiers. The long AEO walkthrough and its
  historical test results do not move.

The two pricing pages are priorities because the requester reports that they
earned pickup. That report is not a measured claim that these revisions improve
AI visibility. Historical AEO citation counts, raw crawler visits, and article
verification narratives are not customer acquisition or fresh test evidence.

The other useful topics already have maintained KB or documentation coverage.
The map proposes **38 article redirects** (four source articles contribute to the
new or revised copy; 34 use existing coverage) and **20 removals**, plus the index
redirect from `/aeo` to `/kb`. A redirect preserves a useful entry point; it does
not mean the original article is republished.

## Cutover sequence

1. Publish the new pricing article and the two updates. Verify the pricing URL
   and every redirect target return successful responses, show the intended
   content, and use the destination's canonical URL. The new article's `date`
   should match its eventual first publication date.
2. Export the final published AEO inventory again and reconcile new or changed
   URLs with this map. Check Search Console clicks and backlinks before removing
   URLs; those sources were not available for this editorial assessment. Keep an
   archival copy of the outgoing content and record the cutover date.
3. At the route that currently serves AEO, install each exact permanent redirect
   and each `410 Gone` response from the map. A `308` is also suitable for the
   permanent moves. Handle the index and trailing-slash variants consistently.
   Verify whether any locale-prefixed or other historical variants were served
   before adding corresponding rules.
4. Replace the old AEO upstream route only after these responses are in place.
   Remove AEO navigation, sitemap entries, and internal links; point internal
   links directly to the replacement articles. Stop any AEO publishing automation
   that would recreate retired pages. Keep the new KB URLs discoverable through
   the KB index and sitemap.
5. Check representative URLs and then the full map against production: redirects
   reach their exact targets without loops, removed pages return `410` rather than
   a success page, and unknown retired AEO article paths return `404` or `410`.
   Do not send all removed or unknown articles to the KB index. Keep crawler
   access to old paths open so crawlers can observe the responses.
6. Retain permanent redirects for at least a year, preferably longer. Monitor
   old and new URLs for indexing, search clicks, referrals, brand mentions, and
   citations; record these separately. Compare equivalent reporting windows and
   account for other changes before attributing any gain to this migration.

The response strategy follows
[Google's URL-migration guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes):
redirect to a relevant replacement, return a missing/removed status when no
replacement exists, update discovery links, and retain the permanent redirects.
The production cutover belongs in the serving application after the content is
live; this PR prepares the articles and exact handoff for that change.
