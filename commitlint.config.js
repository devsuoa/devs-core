// Enforces kb/commit_guidelines.md: `type: description`, lowercase type, no trailing period.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feat", "fix", "improve", "chore", "doc"]],
    // The guidelines only require a lowercase type, not a lowercase description.
    "subject-case": [0],
  },
};
