# 🚀 CodeSaathi AI - 24/7 Free Cloud Deployment Guide

Aapko apna laptop hamesha ON rakhne ki bilkul zaroorat nahi hai. Aap apne backend server ko **Render.com** (ya **Railway / Koyeb**) par **100% FREE** me 24/7 deploy kar sakte hain.

---

## 🌟 Option 1: Render.com par 24/7 Free Hosting (Sabse Best & Recommended)

Render ka Free Web Service tier aapko free Linux container deta hai jisme humne **Node.js + OpenJDK 17** ka Dockerfile pehle se ready kar diya hai!

### Step 1: GitHub par Code Upload Karein
1. GitHub par ek naya repository banayein: `codesaathi-ai`.
2. Apne project ko GitHub par push karein:
   ```bash
   git add .
   git commit -m "Deploy CodeSaathi AI 24/7"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/codesaathi-ai.git
   git push -u origin main
   ```

### Step 2: Render.com par New Web Service Banayein
1. [Render.com](https://render.com) par free account banayein (GitHub se sign in karein).
2. Dashboard me **"New +"** par click karein aur **"Web Service"** choose karein.
3. Apni GitHub repository `codesaathi-ai` select karein.
4. Settings me ye bharein:
   - **Name:** `codesaathi-api`
   - **Root Directory:** `server`
   - **Language / Environment:** `Docker` (Render automatically `server/Dockerfile` detect kar lega)
   - **Instance Type:** `Free`

### Step 3: Environment Variables Dalein
Render dashboard me **"Environment Variables"** tab me ye 4 keys add karein:
- `SUPABASE_URL` = `https://crprckkzxlejmfqwuzla.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `(aapki server/.env se secret key)`
- `OPENROUTER_API_KEY` = `(aapki openrouter key)`
- `OPENROUTER_MODEL` = `openrouter/free`
- `PORT` = `4000`

### Step 4: "Create Web Service" par click karein!
- 2-3 minute me aapka server deploy ho jayega aur Render aapko ek permanent 24/7 URL de dega, jaise:
  ```
  https://codesaathi-api.onrender.com
  ```

---

## 📱 Mobile App ko Cloud Server se Kaise Connect Karein:

Humne CodeSaathi AI mobile app ke andar **Cloud Server Connection** ka direct option de diya hai!

1. Apne mobile me **CodeSaathi AI** app open karein.
2. Bottom navigation se **Settings** ⚙️ me jayein.
3. **"Server & Cloud Connection"** card par jayein.
4. **Backend API Endpoint** me apna Render URL daal dein:
   ```
   https://codesaathi-api.onrender.com/api
   ```
5. **"Save Server URL"** par tap karein.

**🎉 Done!** Ab aapka laptop band ho ya chalu, aapka mobile app 24 ghante chalega!
- Scanner kaam karega.
- Real Java/Python compilation cloud ke OpenJDK 17 par run hoga.
- AI Tutor explain karega.
