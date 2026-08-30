# Buffer / Pinterest Delivery PoC

## Current Decision

- `MOCK / DRY_RUN`: GO
- Buffer draft creation: HOLD until OWNER configures credentials and separately authorizes one draft
- Pinterest publication: NOT AUTHORIZED
- Automatic retry: disabled

The existing local n8n `2.16.1` installation is not a 24/7 runtime and is currently stopped. v0.1 therefore keeps the deterministic request builder in this repository and leaves n8n as an optional execution layer. It does not install a node or create a second Pinterest SSOT.

## Flow

```text
data/pinterest-pin-experiments.json
-> deterministic validation
-> OWNER approval
-> payload hash + idempotency key
-> n8n standard HTTP Request node
-> Buffer GraphQL createPost as draft
-> Buffer Post ID receipt
-> separate OWNER schedule/publish approval
```

The API call must not be retried when the response is ambiguous. A Buffer draft is not Pinterest publication success. Publication requires a Pinterest object ID/URL and verification before the repository record is updated.

## Configuration Boundary

Secret, to be created by OWNER only after a separate GO:

- `BUFFER_API_KEY`

Non-secret settings:

- `BUFFER_PINTEREST_CHANNEL_ID`
- `BUFFER_PINTEREST_BOARD_SERVICE_ID`
- `PUBLIC_STABLE_IMAGE_URL`
- `OWNER_APPROVED_DUE_AT`
- `DRY_RUN=true`
- `LIVE_PUBLISH_ENABLED=false`

Current `pin001` has no image asset, no external Board service ID, and no delivery authorization. `npm run buffer:dry-run` therefore reports `BLOCKED_CONFIGURATION_INCOMPLETE` and performs no network call.

## n8n Nodes

Use only built-in nodes for the first PoC:

1. Manual Trigger during PoC; do not expose a public webhook.
2. Read the approved normalized payload.
3. Code node computes or verifies `payload_sha256`.
4. Data Table reserves `pin_id:payload_sha256:channel_id`.
5. IF node stops duplicates and every non-approved item.
6. HTTP Request sends the GraphQL body to `https://api.buffer.com` only after separate authorization.
7. Code node checks both GraphQL `data` and `errors`; HTTP 200 alone is not success.
8. Data Table records the Buffer Post ID or an ambiguous result. Do not automatically retry createPost.

Do not import or activate a live workflow until the Buffer account, Pinterest channel, image URL, credential storage, and one-Pin authorization have been reviewed.

## Official References

- Buffer API introduction: https://developers.buffer.com/guides/introduction.html
- Posts and scheduling: https://developers.buffer.com/guides/posts-and-scheduling.html
- GraphQL reference: https://developers.buffer.com/reference.html
- Buffer Free plan/API limits: https://support.buffer.com/en-us/articles/buffer-pricing-and-features-6pJrOPuzIt
- Pinterest with Buffer: https://support.buffer.com/en-us/articles/using-pinterest-with-buffer-PB6dp33lMG
- n8n integration guide: https://developers.buffer.com/guides/integrations/n8n.html
