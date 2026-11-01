# Regional analytics — approved user direction

The owner approved regional Google Analytics with a small single-line bottom-floating Accept/Reject notice. EEA, UK and Switzerland require a choice before GA; other countries automatically load GA. The owner expressly chose automatic analytics for unknown locations, including lookup failure/timeout, after being told this is not a fail-safe compliance arrangement. This is a site policy, not a worldwide legal determination.

Use Netlify's trusted request geo in a same-origin, uncached endpoint; no third-party IP service or application IP logging. Wait for its response or a bounded timeout before Google loads. Keep existing rejection valid globally, never save automatic collection as explicit consent, retain accessible settings/revocation, existing privacy restrictions, page/host guards and 90-day explicit choices. Keep the main line compact; details expandable. Wrap mobile controls accessibly and keep Gustavo reachable. Unrelated blog drafts are excluded.

Chosen approach: first-party edge policy endpoint and existing basic-consent controller. Alternatives previously discussed: worldwide compact consent; disable GA entirely. User chose region-dependent behavior. Unknown-on is an explicit trade-off, not an implementation error.
