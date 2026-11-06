# Pinned upstream tracker

`count.v2.7.0.js` and `LICENSE` are unmodified files from
https://github.com/arp242/goatcounter/tree/v2.7.0 (ISC).

SHA-256:
- count.v2.7.0.js: `030ad75a7c80a04107a9b91f79e4b1572da0a583a80a9b67e111b310da11cbe9`
- LICENSE: `cfaff7a8e4c3998ed24b07e9cfa026b5d264d734b3a08909a859cf40f4844e93`

`src/lib/analytics/client.ts` loads the tracker only after explicit consent with
`no_onload` and `no_events`. It wraps `get_data()` to remove `q` and exact screen
width, then replaces the transport with a no-referrer/credentials-omit keepalive
fetch. Using upstream sendBeacon directly would leak the full current query in
same-origin HTTP Referer headers. Review these boundaries before upgrades.
