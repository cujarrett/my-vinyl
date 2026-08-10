# my-vinyl

Browse any [Discogs](https://www.discogs.com/) user's vinyl collection as a grid of album covers.

![my-vinyl](my-vinyl.png)

**[myvinyl.mattjarrett.dev](https://myvinyl.mattjarrett.dev)**

## Deployment

CI builds an ARM64 image, pushes it to GHCR, then commits the new tag to the `my-vinyl` workspace in [homelab-workspaces](https://github.com/cujarrett/homelab-workspaces). ArgoCD deploys from there.

### Rotating `HOMELAB_PAT`

The `deploy` job authenticates to `cujarrett/homelab-workspaces` with `HOMELAB_PAT`, a repo-level Actions secret holding a fine-grained PAT. `cujarrett` is a personal account, not an org, so secrets cannot be shared — other repos define a secret by the same name holding their own token, and rotating one does not affect the others.

When the token expires, `deploy` fails on `Bad credentials (HTTP 401)` while `test` and `build-and-push` stay green. Images keep building and the cluster keeps running the old tag, so nothing looks broken until someone checks what is actually deployed.

```bash
# 1. Mint a replacement at https://github.com/settings/personal-access-tokens
#    Repository access — cujarrett/homelab-workspaces only
#    Permissions — Contents: Read and write

# 2. Replace the secret
print -n "Paste new token: "
read -rs NEW_TOKEN
echo
gh secret set HOMELAB_PAT --repo cujarrett/my-vinyl --body "$NEW_TOKEN"
unset NEW_TOKEN

# 3. Revoke the old token, then confirm the next merge to main still deploys
gh run watch --repo cujarrett/my-vinyl \
  "$(gh run list --repo cujarrett/my-vinyl --branch main --limit 1 --json databaseId --jq '.[0].databaseId')"
```
