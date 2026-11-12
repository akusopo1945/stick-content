# GitHub release guide

This guide shows how to publish the starter kit as its own public GitHub repository, and how to keep it up to date.
The commands are for Windows PowerShell. Replace the placeholders in `<angle brackets>` with your own values.

You need:

- A GitHub account.
- Git for Windows installed (`git --version` should print a version).
- The starter kit in its own folder, which is `<your-folder>\stickman-documentary-starter`.

Run every command from the kit folder unless a step says otherwise:

```powershell
cd "<your-folder>\stickman-documentary-starter"
```

## 1. Create a new GitHub repository

1. Sign in at [github.com](https://github.com).
2. Click **+** at the top right, then **New repository**.
3. Enter the name **`stickman-documentary-starter`**.
4. Add a short description, for example: *Simple educational starter kit for stickman animations in Remotion.*
5. **Do not** tick "Add a README", "Add .gitignore" or "Choose a licence". The kit already has these files, and adding them on GitHub
   would create a conflict.
6. Continue to step 2 before you click **Create repository**.

## 2. Select Public visibility

On the same page, under **Visibility**, choose **Public**. Then click **Create repository**.

GitHub shows a page with setup commands. You will use your own commands below instead, so you can close that page.

## 3. Connect the local kit to GitHub

First check that the folder is a Git repository. If it is not, create one:

```powershell
git status
```

If that says `fatal: not a git repository`, initialise it, and make sure the branch is called `main`:

```powershell
git init -b main
```

Set your name and email for this repository only (replace the values):

```powershell
git config user.name "<Your Name>"
git config user.email "<you@example.com>"
```

Connect the GitHub repository as `origin`:

```powershell
git remote add origin https://github.com/<your-username>/stickman-documentary-starter.git
git remote -v
```

`git remote -v` should list `origin` twice, once for fetch and once for push.

## 4. Review the staged files before you commit

Add the kit's files, then check exactly what is staged:

```powershell
git add .
git status
git diff --cached --name-only
```

Check the list before you commit. It should show only the kit's own files: `README.md`, `CLAUDE.md`, `package.json`, `src/`, `docs/`, and so on.
It must **not** show these, which are excluded by `.gitignore`:

- `node_modules/`
- `out/`
- anything inside `public/audio/` except `.gitkeep`

If you see one of them, stop, fix `.gitignore`, and run `git reset` to unstage everything before you add again.

To count the staged files and their total size:

```powershell
(git diff --cached --name-only | Measure-Object).Count
git diff --cached --name-only | ForEach-Object { if (Test-Path $_) { (Get-Item $_).Length } } | Measure-Object -Sum | ForEach-Object { "{0:N0} bytes" -f $_.Sum }
```

## 5. Create the first commit

```powershell
git commit -m "Initial release: stickman documentary starter kit"
```

Git stores the commit on your computer. Nothing is sent to GitHub until you push.

## 6. Push to main

```powershell
git push -u origin main
```

The first push asks you to sign in to GitHub. Use a browser sign-in or a personal access token. Do not paste a token into a file in this folder.

After the push, refresh the repository page on GitHub.

## 7. Confirm that only public files were uploaded

On the repository page on GitHub:

1. Check the file list. You should see `README.md`, `CLAUDE.md`, `docs`, `src`, `package.json`, `package-lock.json`, `tsconfig.json`,
   `remotion.config.ts`, `.gitignore`, and `public/audio/.gitkeep`.
2. Check that `node_modules`, `out` and any `.mp3` or `.wav` file are **absent**.
3. Open `package.json` and check the `license` field. It is `UNLICENSED` until a licence is added.

If something unexpected is there, do not delete it in a hurry. Remove it locally, commit the removal, and push again.

## 8. Clone and test from a clean folder

This proves that someone else can use the kit without your local files.

```powershell
$test = Join-Path $env:TEMP "stickman-clone-test"
Remove-Item -Recurse -Force $test -ErrorAction SilentlyContinue
git clone https://github.com/<your-username>/stickman-documentary-starter.git $test
cd $test
npm ci
npm run typecheck
npx remotion compositions src/index.ts
npm run render -- Example01-WalkingStickman out/check.mp4
```

Expected results:

- `npm ci` installs the packages without errors.
- `npm run typecheck` prints nothing and exits normally.
- `npx remotion compositions src/index.ts` lists three examples.
- `npm run render` writes `out/check.mp4`.

When you finish, delete the test folder:

```powershell
cd $env:TEMP
Remove-Item -Recurse -Force "$env:TEMP\stickman-clone-test"
```

## 9. Publish future updates safely

Use this routine for every change:

```powershell
cd "<your-folder>\stickman-documentary-starter"
npm run typecheck          # must finish without errors
git status                 # read what changed
git add <file-you-changed> # add the files you intend to publish, one by one
git diff --cached --name-only
git commit -m "Describe the change in one line"
git push
```

Rules for future updates:

- Run `npm run typecheck` before every commit.
- Add files by name, not with `git add .`, so nothing unexpected slips in.
- Check `git diff --cached --name-only` before each commit.
- Never commit a voice recording, a rendered video, an API key or a `.env` file.
- Before adding a new file, check that you have the right to publish it.
- Keep a licence in the repository once you choose one.

## 10. Commit message convention

Use one commit for one change, with a short title that says what changed. Put details in the body.

```text
<type>: <what changed, in the imperative>

<optional body: why, and anything a reviewer should check>
```

Common types:

- `docs:` documentation only (README, guides, CLAUDE.md)
- `feat:` a new feature or example
- `fix:` a bug fix in code or a wrong instruction
- `chore:` dependencies, configuration, tidy-up

Good titles: `docs: add ElevenLabs voice rules`, `fix: caption placement in Example 03`.
Avoid vague titles such as `update` or `initial release` for later changes.
