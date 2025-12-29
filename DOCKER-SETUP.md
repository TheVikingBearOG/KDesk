# Complete Unraid Docker Self-Hosting Guide

This guide provides step-by-step instructions for deploying your support desk app in a Docker container on Unraid for full self-hosting with multi-user access.

## Prerequisites

### 1. Unraid Server Requirements
- Unraid 6.9.0 or later
- Docker service enabled (enabled by default)
- At least 2GB free RAM
- Network access to your Unraid server

### 2. Required Information
You'll need these environment variables:
- `EXPO_PUBLIC_RORK_DB_ENDPOINT` - Your database endpoint URL
- `EXPO_PUBLIC_RORK_DB_NAMESPACE` - Database namespace
- `EXPO_PUBLIC_RORK_DB_TOKEN` - Database authentication token

> **Note**: These are for your existing database. If you don't have a database yet, you'll need to set one up first (SurrealDB recommended).

---

## Step 1: Prepare Your Project Files

### Option A: Using Unraid Terminal (Recommended)

1. **Access Unraid Terminal**:
   - Open Unraid web interface
   - Click on the terminal icon (top right)

2. **Navigate to your appdata directory**:
   ```bash
   cd /mnt/user/appdata/
   mkdir -p kdesk-support
   cd kdesk-support
   ```

3. **Upload your project files**:
   - You can use the Unraid web interface to upload files
   - Or use SCP/SFTP to transfer all project files to `/mnt/user/appdata/kdesk-support/`
   - Or clone from Git if available:
     ```bash
     # If you have git available (install via Nerd Tools plugin)
     git clone <YOUR_GIT_URL> .
     ```

### Option B: Using Network Share

1. **Access Unraid shares** from your computer:
   - Windows: `\\YOUR-UNRAID-IP\appdata`
   - Mac: `smb://YOUR-UNRAID-IP/appdata`
   - Linux: `smb://YOUR-UNRAID-IP/appdata`

2. **Create folder** `kdesk-support`

3. **Copy all project files** into this folder

---

## Step 2: Build the Docker Image

### Using Unraid Terminal

1. **Open Unraid Terminal**

2. **Navigate to project directory**:
   ```bash
   cd /mnt/user/appdata/kdesk-support
   ```

3. **Build the Docker image**:
   ```bash
   docker build -t kdesk-support-app:latest .
   ```
   
   This will take a few minutes. You'll see output as it installs dependencies.

4. **Verify the image was created**:
   ```bash
   docker images | grep kdesk-support-app
   ```
   
   You should see: `kdesk-support-app   latest   ...`

---

## Step 3: Add Container to Unraid

### Method 1: Using Unraid Docker Tab (Recommended)

1. **Go to Docker tab** in Unraid web interface

2. **Click "Add Container"** at the bottom

3. **Configure the container**:

   **Basic Settings:**
   - **Name**: `kdesk-support-app`
   - **Repository**: `kdesk-support-app:latest`
   - **Network Type**: `bridge`
   - **Console shell command**: `bash`

   **Port Mappings:**
   - Click "Add another Path, Port, Variable, Label or Device"
   - Select "Port"
   - **Container Port**: `8081`
   - **Host Port**: `8081` (or any available port)
   - **Connection Type**: `TCP`

   **Environment Variables:**
   Click "Add another Path, Port, Variable, Label or Device" for each:
   
   - **Name**: `EXPO_PUBLIC_RORK_DB_ENDPOINT`
     - **Key**: `EXPO_PUBLIC_RORK_DB_ENDPOINT`
     - **Value**: `your_database_endpoint_here`
   
   - **Name**: `EXPO_PUBLIC_RORK_DB_NAMESPACE`
     - **Key**: `EXPO_PUBLIC_RORK_DB_NAMESPACE`
     - **Value**: `your_namespace_here`
   
   - **Name**: `EXPO_PUBLIC_RORK_DB_TOKEN`
     - **Key**: `EXPO_PUBLIC_RORK_DB_TOKEN`
     - **Value**: `your_token_here`
   
   - **Name**: `EXPO_PUBLIC_PROJECT_ID`
     - **Key**: `EXPO_PUBLIC_PROJECT_ID`
     - **Value**: `q0sa2c9vj7fqop2ycox77`
   
   - **Name**: `EXPO_PUBLIC_RORK_API_BASE_URL`
     - **Key**: `EXPO_PUBLIC_RORK_API_BASE_URL`
     - **Value**: Leave empty or set if needed
   
   - **Name**: `EXPO_PUBLIC_TOOLKIT_URL`
     - **Key**: `EXPO_PUBLIC_TOOLKIT_URL`
     - **Value**: Leave empty or set if needed

   **Advanced Settings:**
   - **Restart Policy**: `unless-stopped` (recommended)
   - **Privileged**: `Off`

4. **Click "Apply"**

5. **Wait for container to start** (check Docker tab)

### Method 2: Using Docker Run Command

In Unraid Terminal:

```bash
docker run -d \
  --name kdesk-support-app \
  --restart unless-stopped \
  -p 8081:8081 \
  -e EXPO_PUBLIC_RORK_DB_ENDPOINT="your_endpoint" \
  -e EXPO_PUBLIC_RORK_DB_NAMESPACE="your_namespace" \
  -e EXPO_PUBLIC_RORK_DB_TOKEN="your_token" \
  -e EXPO_PUBLIC_PROJECT_ID="q0sa2c9vj7fqop2ycox77" \
  kdesk-support-app:latest
```

---

## Step 4: Verify Container is Running

1. **Check Docker tab** in Unraid - container should show as "Started" with green icon

2. **View logs**:
   - Click on the container name
   - Select "Logs"
   - Look for "Metro waiting on" or similar startup messages

3. **Check from terminal**:
   ```bash
   docker ps | grep kdesk-support-app
   docker logs kdesk-support-app
   ```

---

## Step 5: Access Your Application

### From Local Network

Once the container is running, access from any device:

- **Web Browser**: `http://YOUR-UNRAID-IP:8081`
- **Mobile/Tablet**: `http://YOUR-UNRAID-IP:8081`

Replace `YOUR-UNRAID-IP` with your Unraid server's IP address (e.g., `192.168.1.100:8081`)

### From Outside Your Network (Optional)

#### Option 1: Port Forwarding
1. **Configure router port forwarding**:
   - External Port: `8081` (or any port)
   - Internal IP: Your Unraid IP
   - Internal Port: `8081`

2. **Access via**: `http://YOUR-PUBLIC-IP:8081`

⚠️ **Security Warning**: This exposes your app to the internet. Consider using HTTPS and authentication.

#### Option 2: VPN (Recommended)
- Use WireGuard or OpenVPN
- Install VPN plugin on Unraid
- Access as if on local network

#### Option 3: Reverse Proxy with SSL
- Use SWAG (Secure Web Application Gateway) on Unraid
- Set up domain with SSL certificate
- Access via: `https://yourdomain.com`

---

## Management & Maintenance

### View Container Logs

**Via Unraid UI**:
- Docker tab → Click container → "Logs"

**Via Terminal**:
```bash
docker logs -f kdesk-support-app
```

### Stop Container

**Via Unraid UI**:
- Docker tab → Click container → "Stop"

**Via Terminal**:
```bash
docker stop kdesk-support-app
```

### Start Container

**Via Unraid UI**:
- Docker tab → Click container → "Start"

**Via Terminal**:
```bash
docker start kdesk-support-app
```

### Restart Container

**Via Unraid UI**:
- Docker tab → Click container → "Restart"

**Via Terminal**:
```bash
docker restart kdesk-support-app
```

### Update Application

When you make code changes:

1. **Update project files**:
   - Upload new files to `/mnt/user/appdata/kdesk-support/`
   - Or pull from Git if using version control

2. **Rebuild image**:
   ```bash
   cd /mnt/user/appdata/kdesk-support
   docker build -t kdesk-support-app:latest .
   ```

3. **Stop and remove old container**:
   ```bash
   docker stop kdesk-support-app
   docker rm kdesk-support-app
   ```

4. **Start new container** (via Unraid UI or docker run command)

### Remove Everything

To completely remove the app:

1. **Stop and remove container**:
   ```bash
   docker stop kdesk-support-app
   docker rm kdesk-support-app
   ```

2. **Remove image**:
   ```bash
   docker rmi kdesk-support-app:latest
   ```

3. **Delete files** (optional):
   ```bash
   rm -rf /mnt/user/appdata/kdesk-support
   ```

---

## Troubleshooting

### Container Won't Start

1. **Check logs**:
   ```bash
   docker logs kdesk-support-app
   ```

2. **Verify environment variables**:
   ```bash
   docker inspect kdesk-support-app | grep -A 20 Env
   ```

3. **Check if port is already in use**:
   ```bash
   netstat -tulpn | grep 8081
   ```
   If in use, choose different port (e.g., 8082)

### Can't Access from Browser

1. **Verify container is running**:
   ```bash
   docker ps | grep kdesk-support-app
   ```

2. **Check firewall** - Unraid typically allows local network access

3. **Test locally on Unraid**:
   ```bash
   curl http://localhost:8081
   ```

4. **Verify network**:
   - Ensure device is on same network as Unraid
   - Try Unraid IP instead of hostname

### App Shows Errors

1. **Database connection issues**:
   - Verify database is running and accessible
   - Check environment variables are correct
   - Test database connection from Unraid terminal

2. **Check container logs** for specific errors:
   ```bash
   docker logs kdesk-support-app --tail 100
   ```

### Performance Issues

1. **Check resource usage**:
   - Docker tab shows CPU/RAM usage
   - Terminal: `docker stats kdesk-support-app`

2. **Increase container resources** if needed (Unraid handles this automatically)

### Build Fails

1. **Not enough disk space**:
   ```bash
   df -h
   ```

2. **Missing dependencies**:
   - Ensure all project files are copied
   - Check `package.json` exists

3. **Try clean build**:
   ```bash
   docker system prune -a
   docker build --no-cache -t kdesk-support-app:latest .
   ```

---

## Database Setup Notes

Your app requires a database with these connection details:

### If Using SurrealDB (Recommended)

1. **Install SurrealDB on Unraid**:
   - Add SurrealDB container from Community Applications
   - Or run manually:
     ```bash
     docker run -d \
       --name surrealdb \
       -p 8000:8000 \
       --restart unless-stopped \
       surrealdb/surrealdb:latest \
       start --user root --pass root
     ```

2. **Set environment variables**:
   - `EXPO_PUBLIC_RORK_DB_ENDPOINT`: `http://YOUR-UNRAID-IP:8000/rpc`
   - `EXPO_PUBLIC_RORK_DB_NAMESPACE`: `production`
   - `EXPO_PUBLIC_RORK_DB_TOKEN`: Your auth token (use Surreal's authentication)

### Database Persistence

To persist database data:

```bash
docker run -d \
  --name surrealdb \
  -p 8000:8000 \
  -v /mnt/user/appdata/surrealdb:/data \
  --restart unless-stopped \
  surrealdb/surrealdb:latest \
  start --user root --pass root file:/data/database.db
```

---

## Multi-User Access

Once running, multiple users can access simultaneously:

### On Your Local Network
- All users visit: `http://YOUR-UNRAID-IP:8081`
- No additional configuration needed
- Each user gets their own session

### Best Practices for Multi-User

1. **Set up authentication** in your app (if not already)
2. **Use HTTPS** if exposing externally
3. **Regular backups** of database
4. **Monitor resource usage** as users increase
5. **Consider reverse proxy** for better URL (e.g., `support.yourcompany.com`)

---

## Backup & Restore

### Backup Container Configuration

Unraid automatically backs up container configurations. Manual backup:

1. **Export container XML**:
   - Docker tab → Container → "Edit" → Copy settings

2. **Backup database** (important!):
   ```bash
   # Depends on your database setup
   # For SurrealDB:
   docker exec surrealdb surreal export --conn http://localhost:8000 --user root --pass root --ns production --db production backup.sql
   ```

### Restore

1. Rebuild container with same settings
2. Restore database from backup
3. Start container

---

## Advanced Configuration

### Using Docker Compose

For easier management, use Docker Compose:

1. **Install Docker Compose plugin** (via Community Applications)

2. **Create docker-compose.yml** in project directory

3. **Run**:
   ```bash
   cd /mnt/user/appdata/kdesk-support
   docker-compose up -d
   ```

### Custom Port

To use different port (e.g., 3000 instead of 8081):

- Change Host Port in Unraid Docker settings: `3000:8081`
- Access via: `http://YOUR-UNRAID-IP:3000`

### Running Multiple Instances

For development/production separation:

1. Build separate images: `kdesk-support-app:dev` and `kdesk-support-app:prod`
2. Use different ports: 8081 (dev), 8082 (prod)
3. Use different environment variables

---

## Security Recommendations

1. **Change default ports** if exposing externally
2. **Use strong database credentials**
3. **Enable HTTPS** for external access
4. **Regular updates** - rebuild image when updating code
5. **Firewall rules** - restrict access if needed
6. **VPN access** instead of port forwarding
7. **Regular backups** of database and configuration

---

## Support & Resources

### Getting Help

- **Container logs**: First place to check for errors
- **Unraid forums**: https://forums.unraid.net/
- **Docker documentation**: https://docs.docker.com/

### Useful Commands Reference

```bash
# View all containers
docker ps -a

# View container logs
docker logs -f kdesk-support-app

# Access container shell
docker exec -it kdesk-support-app sh

# Check resource usage
docker stats kdesk-support-app

# Rebuild image
cd /mnt/user/appdata/kdesk-support
docker build -t kdesk-support-app:latest .

# Clean up unused images
docker image prune -a
```

---

## Summary

You now have a fully self-hosted support desk application running on Unraid:

✅ Docker container running your app
✅ Accessible from any device on your network
✅ Persistent data via database
✅ Multi-user ready
✅ Auto-restart on reboot
✅ Easy to update and maintain

**Quick Access**: `http://YOUR-UNRAID-IP:8081`

For questions or issues, check the Troubleshooting section above.
