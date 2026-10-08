# Recipe catalog

First batch is implemented. Later rows are listed so the agent can say
"not yet" instead of inventing a playbook.

## First batch (use these)

| ID | Product | Fit | New tables | Primary CTA |
|----|---------|-----|------------|-------------|
| `ai-image` | AI image SaaS | Uses `/image-generate` + credits + plans | No | `/image-generate` |
| `ai-chat` | AI chat / GPT wrapper | Uses `/ai` + credits + plans | No | `/ai` |
| `membership-content` | Paid membership / posts | Uses `/blog` + `/pricing` + `/premium-features` | No | `/pricing` |
| `waitlist` | Pre-launch signup | Auth only; hide pay and demos | No | `/signup` |

Recipe files: [recipes/ai-image.md](recipes/ai-image.md),
[recipes/ai-chat.md](recipes/ai-chat.md),
[recipes/membership-content.md](recipes/membership-content.md),
[recipes/waitlist.md](recipes/waitlist.md).

## Later (do not improvise)

High reuse, write a recipe before applying:

- `ai-video` — `/video-generate` + credits
- `ai-studio` — chat + image + video, one credit pool
- `digital-product` — one-time / lifetime unlock
- `affiliate-content` — blog + affiliate + payment
- `upload-tool` — `/upload` + storage + credits
- `directory` — needs listing schema
- `job-board` — directory variant
- `link-in-bio` — public profile schema
- `micro-saas` — one tool page + subscription (user must define the tool)

## Out of catalog

Do not start a recipe for these; TinyShip has no org / marketplace / inventory model:

- Multi-tenant B2B (teams, seats)
- Two-sided marketplace
- E-commerce cart / shipping
- Booking / calendar
- Real-time collab or social feed

Tell the user these need a real product build via `tinyship-feature`, not a recipe.
