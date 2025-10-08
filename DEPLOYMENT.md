# 🚀 Deployment Guide

This guide covers deploying the Bingo Mobile Game as a static website.

## 📦 Build Process

The project is configured to generate a **static website** using Nuxt's static site generation.

### Generate Static Files

```bash
pnpm build
```

**Output**: `.output/public/` (approximately 432 KB)

**Contents**:
- `index.html` - Main entry point
- `_nuxt/` - JavaScript and CSS bundles
- `admin/`, `card/`, `join/`, `play/` - Pre-rendered pages
- `200.html`, `404.html` - SPA fallback and error pages
- `favicon.ico`, `robots.txt` - Static assets

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

**Automatic Deployment via Git:**

1. **Connect Repository**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub/GitLab repository

2. **Configure Build Settings**
   - Build command: `pnpm build`
   - Publish directory: `.output/public`
   - Node version: 18 or higher

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add: `VITE_PB_URL` = `https://your-pocketbase-url.com`

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy

**Manual Deployment:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
pnpm build

# Deploy
netlify deploy --prod --dir=.output/public
```

### Option 2: Vercel

**Automatic Deployment via Git:**

1. **Connect Repository**
   - Go to https://vercel.com/
   - Click "Add New" → "Project"
   - Import your Git repository

2. **Configure Project**
   - Framework Preset: Nuxt.js
   - Build Command: `pnpm build`
   - Output Directory: `.output/public`
   - Install Command: `pnpm install`

3. **Set Environment Variables**
   - Add: `VITE_PB_URL` = `https://your-pocketbase-url.com`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

**Manual Deployment:**

```bash
# Install Vercel CLI
npm install -g vercel

# Build
pnpm build

# Deploy
vercel --prod
```

### Option 3: GitHub Pages

1. **Build Locally**
   ```bash
   VITE_PB_URL=https://your-pocketbase-url.com pnpm build
   ```

2. **Deploy to gh-pages Branch**
   ```bash
   # Install gh-pages
   npm install -g gh-pages
   
   # Deploy
   gh-pages -d .output/public
   ```

3. **Configure GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages / (root)

### Option 4: Cloudflare Pages

1. **Connect Repository**
   - Go to https://pages.cloudflare.com/
   - Click "Create a project"
   - Connect your Git repository

2. **Configure Build**
   - Build command: `pnpm build`
   - Build output directory: `.output/public`
   - Environment variable: `VITE_PB_URL`

3. **Deploy**
   - Click "Save and Deploy"

### Option 5: Any Static Host

Upload the contents of `.output/public/` to any web server or static hosting service:

- **AWS S3 + CloudFront**
- **Google Cloud Storage**
- **Azure Static Web Apps**
- **DigitalOcean App Platform**
- **Traditional Web Hosting** (cPanel, FTP, etc.)

## 🗄️ PocketBase Deployment

The frontend requires a running PocketBase instance. Deploy PocketBase separately:

### Option 1: VPS (Recommended)

1. **Rent a VPS** (DigitalOcean, Linode, Vultr, etc.)

2. **Install PocketBase**
   ```bash
   # Download PocketBase
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.2/pocketbase_0.26.2_linux_amd64.zip
   
   # Extract
   unzip pocketbase_0.26.2_linux_amd64.zip
   
   # Make executable
   chmod +x pocketbase
   ```

3. **Run as Service**
   ```bash
   # Create systemd service
   sudo nano /etc/systemd/system/pocketbase.service
   ```
   
   ```ini
   [Unit]
   Description=PocketBase
   After=network.target
   
   [Service]
   Type=simple
   User=root
   WorkingDirectory=/root/pocketbase
   ExecStart=/root/pocketbase/pocketbase serve --http=0.0.0.0:8090
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   # Enable and start
   sudo systemctl enable pocketbase
   sudo systemctl start pocketbase
   ```

4. **Setup Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8090;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           # WebSocket support
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

5. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Option 2: PocketHost (Managed)

1. Go to https://pockethost.io/
2. Create an account
3. Create a new instance
4. Import your collections
5. Use the provided URL

### Option 3: Fly.io

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Create `fly.toml` in PocketBase directory
3. Deploy: `fly deploy`

## ⚙️ Configuration

### Environment Variables

**Build Time** (set before building):
```bash
VITE_PB_URL=https://api.yourdomain.com
```

**Important**: Environment variables are embedded at build time, not runtime.

### CORS Configuration

Configure PocketBase to allow requests from your frontend domain:

1. Go to PocketBase Admin UI
2. Settings → CORS
3. Add your frontend domain (e.g., `https://yourdomain.com`)
4. Allow credentials: Yes

### WebSocket Support

Ensure your hosting supports WebSocket connections:
- **Netlify**: ✅ Supported
- **Vercel**: ✅ Supported
- **GitHub Pages**: ⚠️ Limited (polling fallback works)
- **Cloudflare Pages**: ✅ Supported

## ✅ Post-Deployment Checklist

- [ ] Frontend is accessible via HTTPS
- [ ] PocketBase is accessible via HTTPS
- [ ] CORS is configured correctly
- [ ] Environment variable `VITE_PB_URL` is set
- [ ] WebSocket connections work (check browser console)
- [ ] Test player flow: join → select card → play
- [ ] Test admin flow: start game → random draw → reset
- [ ] Test real-time updates across multiple devices
- [ ] Seed initial data (game, cards, questions)

## 🔧 Troubleshooting

### Frontend can't connect to PocketBase

**Check**:
- Is `VITE_PB_URL` set correctly?
- Is PocketBase accessible from the internet?
- Is CORS configured?
- Check browser console for errors

### Real-time updates not working

**Check**:
- WebSocket connections in browser DevTools → Network → WS
- Hosting supports WebSocket
- PocketBase is accessible
- Fallback to polling (should work automatically)

### Build fails

**Check**:
- Node.js version (18+)
- Dependencies installed: `pnpm install`
- Environment variables set
- Check build logs for errors

### 404 errors on page refresh

**Solution**: Configure hosting for SPA routing
- Netlify: Automatic (uses `200.html`)
- Vercel: Automatic
- Others: Configure rewrite rules to serve `index.html`

## 📊 Performance Tips

1. **Enable Compression**: Most hosts enable gzip/brotli automatically
2. **CDN**: Use hosting with built-in CDN (Netlify, Vercel, Cloudflare)
3. **Caching**: Configure cache headers for static assets
4. **PocketBase**: Use a VPS close to your users
5. **Database**: Regularly backup PocketBase SQLite database

## 🔒 Security Notes

- Use HTTPS for both frontend and PocketBase
- Configure CORS properly (don't use `*`)
- Set up PocketBase admin authentication
- Regularly update PocketBase
- Backup database regularly
- Monitor access logs

## 📝 Example Deployment

**Frontend**: Netlify (https://bingo.yourdomain.com)
**Backend**: VPS with Nginx + SSL (https://api.yourdomain.com)

**Total Cost**: ~$5-10/month (VPS only, Netlify is free)

---

**Need help?** Check [SETUP.md](./SETUP.md) for detailed setup instructions.

