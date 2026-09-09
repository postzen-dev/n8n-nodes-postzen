# Publishing and n8n verification

This package is prepared for review; it is not currently verified. Verification is a decision made by n8n after you publish and submit the package.

## Public repository

The package lives in the public `postzen-dev/n8n-nodes-postzen` GitHub repository. Keep the private PostZen monorepo separate. Include source, package-lock.json, MIT license, README, examples, and both workflows.

Check that the npm publisher and GitHub maintainer identities match. The scaffold detected Jesse Eisenbart as the author; confirm the author details in package.json before publishing.

## npm authentication

For a new npm package, first publication may require a granular npm access token because there isn't an existing package settings page for Trusted Publishing yet. Create a token authorized to publish this package (with the appropriate organization permission if using a scoped name). Store it as the repository Actions secret **NPM_TOKEN**. Do not put it in a file or workflow.

The first release still runs in GitHub Actions and includes provenance. After it exists on npm, open the package settings → Trusted Publishers and configure:

- Provider: GitHub Actions
- Repository owner: `postzen-dev`
- Repository name: `n8n-nodes-postzen`
- Workflow filename: `publish.yml`
- Environment: blank (the workflow doesn't specify one)

Then remove the NPM_TOKEN secret. The workflow can publish through OIDC. It grants `id-token: write` and publishes with `--provenance`. Check the [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers) if account setup requirements change.

## First release

1. Complete a live test in local n8n using a PostZen test profile. Test credentials, all list operations, a draft create/get/update/delete round trip, and one intended publishing workflow. Verify multiple input items, pagination, and error handling. Test disconnect/profile deletion only with disposable test data.
2. Run `npm run lint`, `npm test`, and `npm pack --dry-run`.
3. Commit and push the reviewed package to `main` in the public repository. Check that CI passes.
4. The initial package version is `0.1.0`. To publish that exact version, create and push tag `0.1.0` on the reviewed commit. Tags use **no `v` prefix**. The workflow rejects tags that don't match package.json.
5. Check the Publish workflow and the resulting npm package's provenance. No local npm publication is needed.

For subsequent releases, use `npm run release` on a clean `main` checkout with an upstream. The n8n CLI runs checks, bumps the version, commits, tags, and pushes; the GitHub workflow publishes. GitHub release creation may require GitHub authentication. Keep CHANGELOG.md current.

## n8n submission

After publication:

```sh
npx @n8n/scan-community-package n8n-nodes-postzen
```

Resolve any findings, then submit the npm package through the [n8n Creator Portal](https://creators.n8n.io/nodes). Prepare the public repository link, npm package name/version, description, API documentation, credential setup instructions, example workflow, and any test access requested by the portal. Follow the portal's current review steps; don't label the node verified until approval arrives.

n8n requires public source, MIT licensing, English documentation, no external runtime dependencies, no runtime filesystem/environment access, and GitHub Actions publication with npm provenance. See the [official verification guidelines](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines).

PostZen is a single API service that manages multiple social networks. Describe the integration as PostZen and document its own API contract; n8n makes the final decision about eligibility.
