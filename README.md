# TIRTAWANA: The Living Isles

**by DYSTANCEE Studio**

---

## Release checklist (M25)

| Area | Status |
|---|---|
| Landscape-first + RotateScene (portrait blocker) | ✅ since M1 |
| Offline play (SW + IndexedDB, zero external asset calls) | ✅ M21/M23 |
| Optional Supabase login (game never blocked) | ✅ M22 |
| Save: versioned, validated, auto-repair, daily snapshot | ✅ M21 |
| Original IP (all data/code/assets runtime-generated) | ✅ |
| 178 unit tests passing | ✅ |
| TypeScript strict, 0 errors | ✅ |
| Installable PWA (manifest + SW + icons) | ✅ M23 |
| Android APK/AAB via GitHub Actions (no Android Studio) | ✅ M24 |
| Capacitor appId: studio.dystancee.tirtawana | ✅ |

### Player controls (landscape)
- Left half: virtual joystick (dynamic origin) | WASD/arrows on desktop
- Right: ACT (context: TILL/PLANT/WATER/HARVEST/FISH/MINE/CHOP/TALK/EAT/SHOP/SLEEP/🎉FESTIVAL/📋PROJECTS), ATK, ROLL
- Keys: Q/1-5 tools, J quest log, E interact, ESC close panels, T/Y debug time/food, B debug bridge

### Verify locally
```bash
npm install
npm run typecheck   # 0 errors
npm run test        # 178 passed
npm run build       # dist/ for Vercel
npm run dev         # play
# Android: push tag v* with RELEASE_KEYSTORE_BASE64 secret set
```

### Deploy to Vercel
Push this repo to GitHub → vercel.com → Import → framework Vite (auto) → Deploy.
Add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars for cloud save (optional).
Run `supabase/migrations/0001_initial.sql` in the Supabase SQL editor first.
