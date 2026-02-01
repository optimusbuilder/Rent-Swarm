# PDF Upload Fix - Deployment Guide

## Issue
The PDF upload feature was failing on EC2 with the error:
```
Error: Failed to load external module pdf-parse: ReferenceError: DOMMatrix is not defined
```

## Root Cause
1. **Incorrect pdf-parse usage**: The code was using `pdf-parse` as a class constructor, but it's actually a function
2. **Missing canvas dependency**: pdf-parse requires the `canvas` package to provide browser APIs (like DOMMatrix) in Node.js
3. **Missing system dependencies**: Canvas requires native libraries on Linux

## Fixes Applied

### 1. Fixed pdf-parse Import and Usage
**File**: `rent-swarm-dashboard/app/api/lease/analyze/route.ts`

Changed from:
```typescript
import { PDFParse } from 'pdf-parse';
const pdfParser = new PDFParse({ data: buffer });
const textResult = await pdfParser.getText();
pdfText = textResult.text;
await pdfParser.destroy();
```

To:
```typescript
import pdf from 'pdf-parse';
const data = await pdf(buffer);
pdfText = data.text;
```

### 2. Added Canvas Dependency
**File**: `rent-swarm-dashboard/package.json`

Added:
- `canvas: ^2.11.2` (optional dependency - required on Linux/EC2, optional on Windows)
- `@types/pdf-parse: ^1.1.4` (TypeScript definitions)

**Note**: Canvas is an optional dependency because it requires native libraries that are difficult to install on Windows. This means:
- ✅ **On EC2 (Linux)**: Canvas will be installed via Docker and PDF upload will work perfectly
- ⚠️ **On Windows (local dev)**: Canvas won't install, but the app will still build and run (PDF upload just won't work locally)

### 3. Updated Dockerfile
**File**: `rent-swarm-dashboard/Dockerfile`

Added system dependencies for canvas:
- **Build stage**: cairo-dev, jpeg-dev, pango-dev, giflib-dev, pixman-dev, etc.
- **Runtime stage**: cairo, jpeg, pango, giflib, pixman (runtime libraries only)

### 4. Updated Next.js Config
**File**: `rent-swarm-dashboard/next.config.mjs`

Added `canvas` to `serverExternalPackages`:
```javascript
serverExternalPackages: ['pdf-parse', 'canvas']
```

## Deployment Steps

### Step 1: Commit and Push Changes

```bash
git add .
git commit -m "Fix PDF parsing: add canvas dependency and fix pdf-parse usage"
git push origin main
```

### Step 2: Test Build Locally (Optional)

```bash
cd rent-swarm-dashboard
npm install
npm run build
```

**Note for Windows users**: Canvas won't install on Windows, but that's OK! The build will still succeed because canvas is an optional dependency. You can skip local PDF testing - it will work on EC2.

### Step 3: Deploy to EC2

#### Option A: Using Docker (Recommended)

On your EC2 instance:

```bash
# Navigate to project
cd ~/Rent-Swarm

# Pull latest changes
git pull origin main

# Navigate to deployment folder
cd deployment

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Monitor logs
docker-compose logs -f nextjs
```

The Docker build will:
1. Install system dependencies (cairo, jpeg, pango, etc.)
2. Install npm packages including canvas
3. Build the Next.js application
4. Create the production container

#### Option B: Manual Deployment (If not using Docker)

If you're running the app directly on EC2 without Docker:

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev

# Or for Amazon Linux 2023
sudo dnf install -y \
  cairo-devel \
  pango-devel \
  libjpeg-turbo-devel \
  giflib-devel \
  librsvg2-devel \
  python3 \
  gcc-c++ \
  make

# Navigate to project
cd ~/Rent-Swarm/rent-swarm-dashboard

# Install dependencies
npm install

# Build application
npm run build

# Restart application
pm2 restart rent-swarm
# or if using systemd
sudo systemctl restart rent-swarm
```

### Step 4: Verify Fix

1. **Check logs for errors**:
   ```bash
   docker-compose logs -f nextjs
   ```

2. **Test PDF upload**:
   - Navigate to the Lawyer page
   - Upload a PDF lease document
   - Verify it's analyzed successfully

3. **Check for the error**:
   - The "DOMMatrix is not defined" error should be gone
   - PDF text should be extracted successfully

## Troubleshooting

### Issue: Canvas build fails during npm install

**Error**:
```
node-pre-gyp ERR! build error
```

**Solution**: Make sure system dependencies are installed:

**Alpine Linux (Docker)**:
```dockerfile
RUN apk add --no-cache \
    cairo-dev jpeg-dev pango-dev giflib-dev \
    python3 make g++
```

**Ubuntu/Debian**:
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**Amazon Linux 2023**:
```bash
sudo dnf install cairo-devel pango-devel libjpeg-turbo-devel giflib-devel gcc-c++ make python3
```

### Issue: Container builds but PDF still fails

**Check**:
1. Canvas is properly installed in the container:
   ```bash
   docker-compose exec nextjs npm list canvas
   ```

2. Runtime libraries are present:
   ```bash
   docker-compose exec nextjs ls /usr/lib | grep cairo
   ```

3. Next.js config is correct:
   ```bash
   docker-compose exec nextjs cat next.config.mjs
   ```

### Issue: Build time is slow

The canvas package requires compiling native code, which increases build time by 1-2 minutes. This is normal.

**Optimization**: Use Docker layer caching by not changing package.json frequently.

## What Changed

### Dependencies Added
- `canvas@^2.11.2` - Provides Canvas API for Node.js (needed by pdf-parse)
- `@types/pdf-parse@^1.1.4` - TypeScript definitions

### System Libraries Added (Docker)
- cairo, jpeg, pango, giflib (for rendering)
- python3, make, g++ (for building native modules)

### Code Changes
- Fixed pdf-parse import and usage
- Removed incorrect class-based API calls
- Simplified PDF parsing logic

## Performance Impact

- **Build time**: +1-2 minutes (one-time, during deployment)
- **Container size**: +~50MB (canvas and dependencies)
- **Runtime performance**: No change (pdf-parse already used pdf.js internally)

## Alternative Solutions (Not Implemented)

If canvas continues to cause issues, alternative approaches:

1. **Use a different PDF parser**:
   - `pdfjs-dist` with custom worker setup
   - `pdf2json` (lighter but less accurate)

2. **Use a PDF parsing service**:
   - AWS Textract
   - Google Document AI
   - Adobe PDF Services API

3. **Pre-process PDFs**:
   - Convert PDFs to text before upload
   - Use a separate microservice for PDF processing

## Verification Checklist

- [ ] Code changes committed to repository
- [ ] Dependencies installed locally (`npm install`)
- [ ] Local testing completed successfully
- [ ] Changes pushed to GitHub
- [ ] EC2 instance updated (`git pull`)
- [ ] Docker images rebuilt (`docker-compose up -d --build`)
- [ ] Containers are running (`docker-compose ps`)
- [ ] Logs show no canvas/DOMMatrix errors (`docker-compose logs`)
- [ ] PDF upload tested successfully on live site
- [ ] No errors in production logs

## Support

If issues persist:
1. Check Docker logs: `docker-compose logs nextjs`
2. Verify canvas installation: `docker-compose exec nextjs npm list canvas`
3. Test PDF parsing directly: Upload a simple PDF and check logs
4. Check system resources: Ensure EC2 instance has enough memory (2GB minimum recommended)

---

**Status**: ✅ Ready for deployment
**Testing**: ✅ Code changes complete, ready for testing on EC2
**Documentation**: ✅ Complete
