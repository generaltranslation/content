# Content repository

Before editing content, read `DOCS-SKILL.md` in full and follow `CONTRIBUTING.md` for validation.

## Public authentication boundary

- Document API-key authentication for customer SDK and HTTP integrations. General Translation user-token authentication is internal, even when its types or options are exported by a released package. Exclude `userTokenProvider`, `UserTokenProvider`, token acquisition/refresh callbacks, OAuth client/protocol setup, and user-token-only API operations from public prose, examples, type inventories, release notes, and downloadable API specifications. Do not advertise omitted facilities with public "internal API" notes.
- Keep customer-facing CLI and MCP sign-in workflows, including `gt init`, `gt login`, `gt logout`, and `gt whoami`. Explain how to sign in and use the product, not how to obtain or reuse its underlying tokens. Preserve authentication instructions for third-party integrations.
- Apply this boundary before inventorying public API coverage: an export or working endpoint is not by itself approval to document it.
- Correct generated documentation at its upstream publication source, then regenerate the public specification, navigation, and pages. Check machine-readable outputs as well as rendered prose. Keep runtime authentication and internal SDK contracts unchanged unless the task explicitly requests a behavioral change.
