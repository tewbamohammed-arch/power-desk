# Upstream Sync Workflow

## Intent
Keep the Power Desk fork close to `pingdotgg/t3code` with a local-first workflow that minimizes parent feature loss while preserving Power Desk commits. Resolve conflicts locally, prefer rebasing over merge commits, and only update the fork after the rebased branch has been verified.

## Remote Layout
- `fork`: your writable GitHub fork for `power-desk-fork-4ca7381`
- `parent-origin`: the upstream T3 Code repository (`https://github.com/pingdotgg/t3code.git`)

If `parent-origin` is missing:

```powershell
git remote add parent-origin https://github.com/pingdotgg/t3code.git
```

## Guardrails
- Rebase local work onto `parent-origin/main`; do not merge `parent-origin/main` into the fork branch unless you deliberately want a merge commit.
- Before a rebase, create a timestamped backup branch from the current local branch.
- Resolve all parent-vs-fork conflicts locally, where the codebase and tests are available.
- Push back to the fork only after `typecheck`, `build`, and as much of `test` as is healthy in the current environment.
- When rewriting fork history after a rebase, use `git push --force-with-lease`, not `--force`.

## Recommended Branch Model
- `fork/main`: the fork’s published integration branch on GitHub
- local working branch: a branch such as `fork-main-apply` or a feature branch rebased onto `parent-origin/main`
- temporary safety branch: `backup/<branch>-pre-parent-YYYYMMDD`

## Standard Sync Procedure
1. Fetch everything.

```powershell
git fetch fork --prune --tags
git fetch parent-origin --prune --tags
```

2. Confirm the current branch and worktree are in a state you can safely rebase.

```powershell
git status --short --branch
git log --oneline --decorate --max-count=12
```

3. Create a local safety branch before rewriting history.

```powershell
git branch backup/$(git branch --show-current)-pre-parent-20260313
```

Use the current date in the branch name.

4. Rebase the local branch onto upstream.

```powershell
git rebase parent-origin/main
```

5. Resolve conflicts locally.
- Prefer upstream behavior for generic T3 Code features unless Power Desk intentionally overrides it.
- Reapply Power Desk changes on top of the upstream shape instead of carrying old fork copies forward unchanged.
- After each conflict batch:

```powershell
git add <resolved-files>
git rebase --continue
```

6. Verify the rebased branch.

```powershell
bun run typecheck
bun run build
bun run test
```

If full `bun run test` is known to fail on the current machine for unrelated reasons, record the failing suites and run the focused suites covering the touched areas.

7. Inspect divergence before pushing.

```powershell
git status --short --branch
git rev-list --left-right --count parent-origin/main...HEAD
git rev-list --left-right --count fork/main...HEAD
```

Interpretation:
- `parent-origin/main...HEAD`: how many upstream commits are still not in your branch vs how many Power Desk commits are on top
- `fork/main...HEAD`: whether the published fork can fast-forward or needs a history rewrite

8. Update the fork only after local verification.

If the rebased branch rewrote fork history:

```powershell
git push fork HEAD:main --force-with-lease
```

If the fork can fast-forward:

```powershell
git push fork HEAD:main
```

## Daily Maintenance Flow
Use this when upstream is active and you want small, low-risk syncs:

```powershell
git fetch parent-origin --prune --tags
git switch fork-main-apply
git branch backup/fork-main-apply-pre-parent-20260313
git rebase parent-origin/main
bun run typecheck
bun run build
```

If those pass, continue with focused tests for the touched area and then push with `--force-with-lease` if needed.

## Updating a Feature Branch
If you are on a long-lived feature branch:

```powershell
git fetch parent-origin --prune --tags
git switch <feature-branch>
git branch backup/<feature-branch>-pre-parent-20260313
git rebase parent-origin/main
```

Do not merge `fork/main` into the feature branch just to catch up with upstream unless the branch already depends on unpublished fork-only commits that are not yet rebased.

## Recovering from a Bad Rebase
- Abort the in-progress rebase:

```powershell
git rebase --abort
```

- Or switch back to the safety branch:

```powershell
git switch backup/<branch>-pre-parent-20260313
```

- Or reset the local working branch to the safety branch if you explicitly want to discard the failed rebase result:

```powershell
git switch <branch>
git reset --hard backup/<branch>-pre-parent-20260313
```

Only use the last command when you are certain you want to discard the rebased state.

## Current Parent-Fork Setup
For this repo, the working setup is:
- parent repo: `pingdotgg/t3code`
- upstream remote: `parent-origin`
- preferred sync target: `parent-origin/main`
- preferred publish target: `fork/main`

## Why This Workflow
- It keeps upstream T3 Code history readable instead of accumulating fork merge commits.
- It lets Power Desk resolve architectural conflicts locally, where tests and the full workspace are available.
- It makes the GitHub fork history look reconciled after the final push, because the fork branch becomes a clean set of Power Desk commits on top of current upstream.
