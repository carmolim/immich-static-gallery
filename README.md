# Immich Static Gallery

A lightweight, Dockerized tool that syncs public albums from your **[Immich](https://github.com/immich-app/immich)** server, generates a **static photo & video gallery** using [Thumbsup](https://thumbsup.github.io/), and optionally deploys it to **Cloudflare Pages** or **GitHub Pages**.

> **Why?**  
> Immich is amazing, but it's self-hosted. This tool lets you share selected albums publicly **without exposing your Immich server**.

---

## Features

- Syncs selected **Immich album(s)** via API
- Automatically **detects new photos/videos** using an internal cache
- Generates a static gallery using the **Thumbsup** engine (default theme: Flow)
- Optionally deploys to **Cloudflare Pages** or **GitHub Pages**
- Runs in a **single Docker container**
- Configurable via `config.yaml`

---

## Demo

![screenshot](./docs/demo.png)

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/your-username/immich-static-gallery.git
cd immich-static-gallery

```

### 2. Create your `config.yaml`

Copy `config.yaml.example` to `config.yaml` and customize it.

```yaml
# Example config.yaml

albums:
  - id: "album-uuid-from-immich" # Get this from the Immich web UI URL
    slug: "family-vacation"      # URL-friendly name for the gallery folder
    title: "Family Vacation"     # Display title for the gallery

scan:
  intervalMinutes: 60 # How often to check Immich for updates (in watch mode)

output:
  # These paths are relative to the 'output' directory mounted in Docker
  contentDir: "./temp"     # Temporary storage for downloaded assets
  publicDir: "./public"    # Final static gallery output

gallery:
  engine: "thumbsup" # Currently only thumbsup is supported
  flags:
    # Pass flags directly to the thumbsup command-line tool
    - "--theme"
    - "cards"
    - "--title"
    - "My Awesome Gallery"
    - "--sort-media-direction"
    - "desc"
    - "--cleanup" # Remove temporary files after build
    # Add any other valid thumbsup flags here

deploy:
  method: "cloudflare"  # or null to disable
  cloudflare:
    # Requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env
    projectName: "your-cloudflare-pages-project-name"
```

### 3. Create your `.env` file

You can provide Immich and Cloudflare credentials via a `.env` file:

```dotenv
# .env file
IMMICH_SERVER=https://your-immich.instance/api
IMMICH_API_KEY=your_long_api_key_from_immich

# Required for Cloudflare deployment
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_with_pages_permission
```

### 4. Run with Docker Compose

Make sure you have Docker and Docker Compose installed.

```bash
# Create the output directory if it doesn't exist
mkdir -p output

# Build and run the container in detached mode
docker compose up --build -d
```

This will:
1. Build the Docker image.
2. Start the container.
3. Pull initial assets from Immich.
4. Generate the static gallery into the `./output/public` directory.
5. Deploy if configured.
6. Continue running in the background, checking for updates every `scan.intervalMinutes`.

Check the logs: `docker compose logs -f`

---

## Manual Builds

To run the sync and build process just once without scheduling:

```bash
docker compose run --rm gallery node bin/sync.js once --config config.yaml
```
*(Note: Environment variables from `.env` might not be automatically loaded with `docker compose run`. You might need to pass them explicitly or use a different method.)*

---

## Deployment Options

### Cloudflare Pages

- **Prerequisites:**
    - You must have a Cloudflare account.
    - **You need to create a Cloudflare Pages project manually *before* running the deployment.** You can create an empty project or connect it to a placeholder Git repository initially.
    - The `projectName` in your `config.yaml` **must exactly match** the name of your existing Cloudflare Pages project.
- **Authentication:**
    - Provide your Cloudflare Account ID and an API Token with "Cloudflare Pages" edit permissions via the `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables (e.g., in your `.env` file).
    