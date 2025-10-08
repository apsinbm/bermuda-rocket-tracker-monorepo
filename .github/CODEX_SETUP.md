# Codex Code Review Setup

This repository uses OpenAI's Codex to automatically review code changes via GitHub Actions.

## 🔑 Setting Up the OpenAI API Key

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click **"Create new secret key"**
4. Give it a name like "GitHub Actions - Codex Review"
5. **Copy the key** - you won't be able to see it again!

### Step 2: Add the Secret to GitHub

1. Go to your repository: https://github.com/apsinbm/bermuda-rocket-tracker-monorepo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Set:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (paste it here)
5. Click **"Add secret"**

### Step 3: Test the Workflow

1. Push a commit or create a pull request
2. Go to **Actions** tab in your repository
3. Look for the "Codex Code Review" workflow
4. Click on it to see the results

## 🤖 What Codex Reviews

The Codex action automatically checks:

- ✅ **Code Quality** - TypeScript/JavaScript best practices
- ✅ **Potential Bugs** - Null checks, error handling, async issues
- ✅ **Security** - API key exposure, XSS vulnerabilities
- ✅ **Architecture** - Component design, service patterns
- ✅ **Monorepo Issues** - Circular deps, incorrect imports

## 🔒 Security

- Codex runs in **read-only mode** - it cannot modify code
- API key is stored as an encrypted GitHub secret
- Workflow only triggers on main branch and pull requests

## 💰 Pricing Note

OpenAI API usage is billed per token. Code reviews typically cost:
- Small changes: $0.01 - $0.05
- Medium PRs: $0.10 - $0.50
- Large refactors: $0.50 - $2.00

Set usage limits in your OpenAI account to control costs.

## 📊 Viewing Results

After each run:
1. Go to **Actions** tab
2. Click on the workflow run
3. Expand **"Review code with Codex"** step
4. Read the detailed review and recommendations

## 🛠️ Customizing the Review

Edit `.github/workflows/codex-review.yml` to:
- Change what Codex focuses on
- Add project-specific checks
- Modify the prompt for your needs
