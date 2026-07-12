# Contributing to RadeonShift AI

First off, thank you for considering contributing to RadeonShift AI! We aim to build the AI-assisted migration path from NVIDIA CUDA to AMD ROCm, and community contributions to the translation rules, AI prompts, and Developer tooling are highly valued.

## Branch Naming Convention

Please create a new branch for your work using the following prefixes:
- \`feat/\` for new features (e.g., \`feat/add-new-hero-kernel\`)
- \`fix/\` for bug fixes (e.g., \`fix/ptx-regex-edge-case\`)
- \`docs/\` for documentation updates
- \`chore/\` for maintenance tasks, dependency bumps, etc.

## Commit Style

We follow the Conventional Commits specification. This helps us automate changelogs and versioning.
- \`feat: add syntax highlighting to code viewer\`
- \`fix: resolve race condition in MoA parallel execution\`
- \`docs: update API endpoints in README\`
- \`chore: update Next.js to 14.2\`

## Local Setup

### Backend (FastAPI / Python)
1. \`cd backend\`
2. \`python -m venv .venv\`
3. \`source .venv/bin/activate\` (or \`.venv\\Scripts\\activate\` on Windows)
4. \`pip install -r requirements.txt\`
5. \`uvicorn main:app --reload\`

### Frontend (Next.js)
1. \`npm install\`
2. \`npm run dev\`

## Testing Expectations

Before opening a Pull Request, please ensure:
1. The frontend compiles and runs without warnings (\`npm run build\`).
2. The backend API handles valid and invalid CUDA code gracefully.
3. If modifying the GitHub Action (\`.github/workflows/radeonshift.yml\`), test it against a dummy repository first.
4. **No secrets (e.g., \`FIREWORKS_API_KEY\`) are hardcoded or committed.**

## Documentation

If your change alters system behavior, endpoints, or environment variables, please update the \`README.md\` and relevant files in the \`docs/\` directory to reflect the new state.
