# Project D

Project D is a Telegram WebApp game built using Phaser 3 for the frontend and ASP.NET Core (.NET 10) with PostgreSQL for the backend. 

Players can explore maps, fight and catch wild monsters, stake them in a collector setup to generate passive income, and trade items/monsters with other players in the marketplace.

---

## How to Play

### 1. The Start
Every new player starts with a signup bonus:
- **A Starter Monster**: Choose between **Grunko** (Earth), **Blubbo** (Water), or **Blazik** (Fire).
- **Starting Loot**: 15 GOLD, 2 MonstaBalls, 1 HealSpell, and 1 RagePotion.

### 2. Exploring & Catching
Walk around maps to trigger wild monster encounters. Battles are turn-based:
- Lower the wild monster's HP to make it easier to catch.
- Throw a **MonstaBall** to catch it. Rare and Legendary monsters are much harder to capture!
- If your monster's HP drops to 0, use a **HealSpell** to get them back on their feet.

### 3. Elements (Strengths & Weaknesses)
Elemental match-ups deal **1.2x damage** for advantages and **0.8x damage** for disadvantages:
- **Fire** 🔥 beats Earth and Electric.
- **Earth** 🪨 beats Electric and Water.
- **Electric** ⚡ beats Dark and Water.
- **Water** 💧 beats Dark and Fire.
- **Dark** 🌙 beats Fire and Earth.

### 4. Collector Slots (Passive Income)
You can stake your monsters in the Collector menu to earn passive rewards over time:
- Staking slots are split by rarity: Common, Rare, Epic, and Legendary.
- Staked monsters accumulate currency while they are in the slot.
- Once you unstake a monster, it enters a resting cooldown phase before you can use or stake it again.

### 5. Missions & Daily Streaks
- **7-Day Streak**: Log in daily to claim rewards. Day 7 gives you a Grand Red Chest containing Gold and multiple items.
- **Missions**: There are Daily tasks, Weekly objectives, and Achievements (e.g., complete 20 battles, level up a monster) that reward you with extra Gold and items.

### 6. Marketplace
A player-to-player trading board where you can:
- List monsters or consumable items (like Spells and MonstaBalls) for sale.
- Buy items or monsters using either **GOLD** or **TON**.

---

## Developer Setup

### 1. Configuration
Copy the sample environment file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in:
- `DB_CONNECTION_STRING` (Your PostgreSQL database connection)
- `TELEGRAM_BOT_TOKEN` (Bot token from BotFather)
- `ADMIN_USER_IDS` (Your Telegram ID to access backend configurations)

### 2. Run the Game
Run the database migration and start the backend:
```bash
dotnet ef database update
dotnet run
```
---

## Deployment

To deploy Project D for production (required for Telegram WebApp integration since Telegram demands HTTPS):

### 1. Build for Production
Generate the compiled release binaries:
```bash
dotnet publish -c Release -o ./publish
```
Then run the executable inside the `./publish` directory:
```bash
./publish/monster-world
```

### 2. Expose the Server with HTTPS
Telegram WebApps must run on a secure HTTPS domain. You can expose your app in two ways:

#### Option A: Cloudflare Tunnel (Easiest & Recommended)
Cloudflare Tunnels let you expose your local port (`5157`) to a public HTTPS domain without managing SSL certificates manually.

**Step 1: Install `cloudflared`**
*   **Ubuntu/Debian:**
    ```bash
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    ```
*   **macOS:**
    ```bash
    brew install cloudflare/cloudflare/cloudflared
    ```
*   **Windows:** Download the installer from Cloudflare's release page and add it to your System PATH.

**Step 2: Log in to your Cloudflare Account**
Link your command line tool to your Cloudflare account:
```bash
cloudflared tunnel login
```
This will print a link. Open it in your browser, log in, and authorize the domain name you want to use.

**Step 3: Create the Tunnel**
Create your tunnel (we'll name it `monsterworld`):
```bash
cloudflared tunnel create monsterworld
```
This creates a credentials JSON file in `~/.cloudflared/` and returns a **Tunnel ID**.

**Step 4: Link your Subdomain (DNS Routing)**
Point your custom subdomain (e.g., `game.yourdomain.com`) to your tunnel:
```bash
cloudflared tunnel route dns monsterworld game.yourdomain.com
```

**Step 5: Start the Tunnel**
Run this command to start forwarding public HTTPS requests directly to your local ASP.NET server:
```bash
cloudflared tunnel run --url http://localhost:5157 monsterworld
```
Once connected, set your `WEBAPP_URL` in `.env` to `https://game.yourdomain.com/index.html`.

#### Option B: Nginx + Let's Encrypt (Production VPS)
1. Run the app on a local port (e.g. `5157`) as a `systemd` background service to keep it running.
2. Set up Nginx as a reverse proxy pointing to `http://127.0.0.1:5157`.
3. Run Certbot to install SSL certificates for your domain:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Author
Created by **Hritik**.
