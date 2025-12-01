# Claudyne Mobile APK Management

## Problem with Current Setup

APK files are committed to git:
- ❌ `claudyne.apk` (51 MB)
- ❌ `claudyne-latest.apk` (91 MB)
- **Total: 142 MB of binary in git history**

This bloats the repository and poses risks.

---

## Solution: GitHub Releases

### Step 1: Remove APKs from Git History

```bash
cd /c/Users/fa_nono/Documents/CADD/Claudyne

# Remove from git tracking (but keep local)
git rm --cached claudyne-mobile/claudyne.apk
git rm --cached claudyne-mobile/claudyne-latest.apk

# Commit removal
git commit -m "chore: Remove APKs from git - use GitHub Releases"
```

### Step 2: Upload to GitHub Releases

Using GitHub CLI:

```bash
# Login if needed
gh auth login

# Create release and upload APKs
gh release create v1.0.0 \
  --title "Claudyne Mobile v1.0.0" \
  --notes "Official APK builds" \
  claudyne-mobile/claudyne.apk \
  claudyne-mobile/claudyne-latest.apk
```

Or manually via GitHub web UI:
1. Go to: https://github.com/YOUR_ORG/Claudyne/releases
2. Click "Draft a new release"
3. Upload the .apk files
4. Publish

### Step 3: Update CI to Build & Release

Add to `.github/workflows/ci.yml`:

```yaml
  build-apk:
    name: Build APK
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    defaults:
      run:
        working-directory: ./claudyne-mobile

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: 'npm'

      - name: Install Expo CLI
        run: npm install -g eas-cli

      - name: Build APK
        run: eas build --platform android --non-interactive
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}

      - name: Upload to Release
        run: gh release upload latest *.apk --clobber
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Alternative: AWS S3 / Google Cloud Storage

If GitHub Releases space is limited:

```bash
# Upload to S3
aws s3 cp claudyne.apk s3://claudyne-builds/v1.0.0/

# Users download via:
curl https://s3.amazonaws.com/claudyne-builds/v1.0.0/claudyne.apk -O
```

---

## Rules Going Forward

1. ❌ **Never commit .apk or .ipa files to git**
2. ✅ **Use GitHub Releases for official builds**
3. ✅ **Automate via CI/CD** (EAS Build for Expo)
4. ✅ **Version releases clearly** (v1.0.0, not claudyne-latest.apk)

---

## .gitignore Entry (Already Added)

```
# Binary files
*.apk
*.ipa
*.exe
*.dmg
*.app

# Mobile builds
claudyne-mobile/builds/
claudyne-mobile/backups/
```

---

## Current Status

- [x] APKs identified (142 MB)
- [x] .gitignore updated
- [ ] APKs removed from git history (requires new filter-branch)
- [ ] Uploaded to GitHub Releases (manual or CI step)
- [ ] CI/EAS integration set up (optional, for auto-builds)

---

## Next Steps

1. Decide: Keep APKs locally or remove completely?
2. Upload current APKs to GitHub Releases
3. Update download links in documentation
4. Add `claudyne-mobile/builds/` to .gitignore (already done)
