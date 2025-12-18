# DEVS Commit & Branching Guidelines

These guidelines define how to write commit messages and name branches for DEVS projects. 
They exist to keep our Git history **clean, readable, and consistent**. As well as to avoid any breaking changes from being deployed into production

> **Important:**  
> Always open a Pull Request  
> Do **NOT** merge directly into `main`
> Do **NOT** approve your own PR

## Commit Message Format

All commit messages **must** follow this format:

`type: description`


### Commit Types

| Type | Description | Example |
|----|----|----|
| `feat` | A new feature | `feat: add construction page` |
| `fix` | A bug fix | `fix: member signups not loading` |
| `improve` | Improvements to existing functionality | `improve: refactor landing page` |
| `chore` | Maintenance tasks or updates | `chore: update dependencies` |
| `doc` | Add or update Documentation | `doc: add commit guidelines` |

### Rules
- Use **lowercase** for the type
- Keep descriptions **short and clear**
- Do not end commit messages with a period

---

## Branch Naming Format

All branches **must** follow this format:

`[your-name]/[task-id]-[task-description]`


### Components

| Component | Description | Example |
|----|----|----|
| `your-name` | Your first name, lowercase, hyphenated if needed | `baljot` |
| `task-id` | Task ID from the task sheet | `DV-11` |
| `task-description` | Brief description, lowercase & hyphenated | `add-construction-page` |

### Example Branch Name

`baljot/DV-11-add-construction-page`

### Rules
- Use **kebab-case** for descriptions
- Keep branch names readable and concise
- One task per branch


## Pull Request Rules

- All changes must go through a **Pull Request**
- PRs should:
  - Have a clear title
  - Reference the task ID
  - Be small and focused where possible
- Do not self-merge unless explicitly approved
