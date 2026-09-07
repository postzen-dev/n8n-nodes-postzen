# n8n-nodes-postzen

A community node for [n8n](https://n8n.io) that creates, schedules, and manages social media posts through [PostZen](https://www.postzen.dev).

**Status:** initial implementation, not yet published or verified by n8n. Cloud availability requires n8n approval. See [RELEASING.md](RELEASING.md) for publication and verification setup.

## Operations

| Resource | Operations                            |
| -------- | ------------------------------------- |
| Post     | Create, Get, Get Many, Update, Delete |
| Profile  | Create, Get, Get Many, Update, Delete |
| Account  | Get Many, Disconnect                  |
| Media    | Create Upload URL                     |

Create posts as drafts, publish now, schedule a future time, or add to a PostZen queue. Target Bluesky, Facebook, Instagram, LinkedIn, Pinterest, Telegram, Threads, TikTok, X, and YouTube using accounts connected in PostZen. Platform requirements and account permissions still apply.

Get Many emits one n8n item per record. Account and post lists paginate automatically, with Return All or a total Limit. PostZen caps post listings to the 1,000 most recent matching posts. Profile listings aren't paginated.

## Credentials

1. Sign in to [PostZen](https://app.postzen.dev).
2. Open [API Keys](https://app.postzen.dev/api-keys) and create a key.
3. Choose **Read & Write** for creating, editing, deleting, uploading, or disconnecting. **Read Only** works for retrieval.
4. Add a **PostZen API** credential in n8n and paste the key into **API Key**.
5. Test the credential. The test calls `GET /v1/profiles` and doesn't change data.

Profile creation requires a read-write key with access to all profiles. Other operations respect the key's profile scope. Connect social accounts in the PostZen dashboard before targeting them in a workflow. PostZen's social OAuth connection endpoints connect social accounts to PostZen; the public API itself authenticates with a PostZen API key.

Keys are handled by n8n's credential store and sent as a Bearer token to `https://api.postzen.dev`. Never put API keys into workflow JSON or node parameters.

## Local development

Use Node.js 24 or later (Node.js 24 LTS is the CI baseline):

```sh
npm ci
npm run lint
npm test
npm run dev
```

The official `n8n-node` CLI starts a local n8n instance at `http://localhost:5678` with this node installed. Its first run downloads n8n and may take several minutes. Follow n8n's supported Node.js range for the installed n8n version.

For a separate local data directory:

```sh
npm run dev -- --custom-user-folder /tmp/postzen-n8n-dev
```

After publication, self-hosted users can install `n8n-nodes-postzen` from **Settings → Community nodes**. On n8n Cloud, installation becomes available only after n8n verifies the package.

## First workflow

Import [examples/create-draft.json](examples/create-draft.json), choose your PostZen credential, and execute it. It creates an untargeted draft and fetches that draft by ID. It does not publish to a social network.

For a targeted post:

1. Run **Account → Get Many** to find each PostZen account `_id` and platform.
2. Add **Post → Create** and choose a posting mode.
3. Add one or more **Target Accounts**, with their platforms and account IDs.
4. Enter **Content**, and optionally media URLs, a title, tags, or platform settings.
5. Execute the node. The output is the post object, including `_id`, status, and platform results.

A scheduled time must be at least 60 seconds in the future. **Add to Queue** passes the profile and optional queue ID to PostZen, which claims the next slot atomically. Leave Queue ID empty to use the profile's default queue.

Platform Settings accepts a JSON object matching the relevant platform schema in the [PostZen API reference](https://docs.postzen.dev). For example, some platforms require additional settings for videos or other post types. Empty Custom Content uses the shared text.

### Updates and retries

**Post → Update** preserves omitted values, including content, timing, targets, and media. Add only fields you intend to change. The default posting mode is **Keep Current Mode**. Enable **Replace Target Accounts** or **Replace Media** to replace those entire lists. An empty replacement media list removes all existing media. Empty Content or Tags explicitly clears those fields.

For Create, optionally set **Request ID** to a stable unique value for that logical post. Repeating it returns the original post. Use a different ID for every new post and every input item; a static ID across a batch reuses the first post. Both fresh creation and idempotent replay return the same post shape. Without a Request ID, retrying a creation may create another post.

Delete returns `{ "deleted": true }`. PostZen rejects deletion of published or publishing posts. Disconnect removes the connection from PostZen; it doesn't delete the social account. Default profiles and profiles with connected accounts cannot be deleted.

### Media

Public image/video URLs can be supplied directly in Media; PostZen downloads and hosts them. External files must meet PostZen's size and type limits. Up to 10 media items are supported per post.

For a file upload, use **Media → Create Upload URL**, then n8n's **HTTP Request** node to `PUT` the binary file to `uploadUrl`, with the matching Content-Type. Set authentication to **None** on this PUT: the signed URL authorizes the upload. Use `publicUrl` in the post after the upload succeeds. The PostZen node itself doesn't perform the binary upload. PDFs require PostZen-hosted upload rather than external URL ingestion.

## Output and errors

Accounts have a **Simplify** toggle. As an AI tool, accounts offer simplified, raw, or selected fields; selected output always includes `_id`. Other operations return the API's resource shape. n8n handles HTTP failures and its retry/continue-on-error settings. API responses distinguish invalid credentials, insufficient permissions, inaccessible resources, invalid parameters, and rate limits. A successful HTTP response can still describe a post whose platform result failed: inspect its `status` and `platforms` fields.

This release doesn't include OAuth account connection flows, analytics, inbox, webhook triggers, direct binary uploads, or CSV bulk upload operations. Use n8n's HTTP Request node with PostZen credentials for other public API endpoints.

## Development and validation

The node uses TypeScript and declarative HTTP routing with no runtime dependencies. Small pre-send hooks validate and construct post/profile bodies. Tests cover timing modes, non-destructive updates, request IDs, response normalization, pagination expressions, and credentials. They use fixtures and don't contact PostZen.

- `npm run build`: compile and copy assets.
- `npm run lint`: official strict community-node linter.
- `npm test`: build and run contract tests.
- `npm run typecheck`: TypeScript checks.
- `npm pack --dry-run`: inspect the package contents.

Run live checks with a test profile before publishing; the automated tests don't establish live social publishing behavior.

## Resources

- [PostZen documentation](https://docs.postzen.dev)
- [n8n community node documentation](https://docs.n8n.io/integrations/community-nodes/building-community-nodes)
- [n8n verification requirements](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines)

## License

[MIT](LICENSE)
