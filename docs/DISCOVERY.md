# Discovery — October 11, 2026

Source: https://blog.smu.edu/chemgrads/

Initial browser-tool requests failed. Retrying with Node's verified system trust store returned HTTP 200 JSON. Public interfaces are available; no administrative credentials or WordPress modifications were necessary.

## Verified endpoints

- `/wp-json/wp/v2/pages?per_page=100`: eight pages.
- `/wp-json/wp/v2/posts?per_page=100`: three posts, published in 2022 and 2024.
- `/wp-json/wp/v2/categories?per_page=100`: Announcements, Graduate Student Seminar, Meeting Notes, Uncategorized.
- `/wp-json/wp/v2/types`: includes ordinary pages/posts/media and `calendar_event`.
- `/wp-json/wp/v2/media?include=401,394,464,467`: four officer photos.
- `/wp-json/wp/v2/calendar_event`: event posts; publication date is NOT event date.
- `/wp-json/calendar-plus/v1/events?month=11&year=2024`: event occurrences, dates, descriptions, source links, and Google Calendar links containing UTC timestamps.
- `/wp-json/calendar-plus/v1/events?month=10&year=2026`: empty at discovery time.
- `/wp-json/calendar-plus/v1/events/456/dates`: occurrence dates for the General Body Meeting.

## Pages

`288-2` (homepage), `officers`, `announcements`, `upcoming-cgc-events`, `fundings`, `food-and-housing-resources`, `graduate-seminar-series`, and `links`.

The homepage states two objectives: professional development and bringing more fun to graduate life. The published officer page has five positions: President, Vice President, Treasurer, Secretary, and GSA and Moody Representative. Four photos exist; the Secretary has no photo in the current source. No academic terms are exposed, so the app does not invent them.

## Limitations

- WPBakery shortcodes survive in REST `content.rendered`. The content adapter removes layout shortcodes; original page layouts and shortcode-only assets are not copied into the new UI.
- The officer page needs a compatibility parser because its content is unstructured. A native WordPress table is the recommended long-term format.
- Calendar+ dates are absent from standard event JSON. The app uses the verified Calendar+ monthly endpoint and the UTC timestamps supplied in its Google Calendar URLs.
- November 2024 All Hallows Party has conflicting scheduled and prose times. The app follows structured calendar timing and links to the source. The council should correct conflicting source content.
- Older resource forms, policy amounts, and contact details need officer review. Their original links are retained with a visible freshness note.
- The current announcements are historical. They are displayed with original publication dates and never used as upcoming event data.
- GitHub API verified that the target repository exists and is empty.

No private user endpoints were queried. Public data snapshots used for inspection are ignored by Git.
