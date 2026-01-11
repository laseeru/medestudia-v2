# Setting Up DeepSeek API for Local Development

## Step 1: Get Your DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key
5. **Copy the key immediately** (you won't be able to see it again)

## Step 2: Create Environment File

Create a `.env.local` file in the project root directory:

```bash
cd /Users/abdulrashiddasana/Desktop/MedEstudia-v2/medestudia-ayuda-pro
touch .env.local
```

Then add your API key to `.env.local`:

```env
DEEPSEEK_API_KEY=your_actual_api_key_here
```

**Important**: Never commit `.env.local` to git (it's already in `.gitignore`).

## Step 3: Run with Vercel CLI (Recommended)

Since the API functions are Vercel serverless functions, use Vercel CLI to run them locally:

```bash
# Install Vercel CLI (if not already installed globally)
npm install -g vercel

# Or use the local version
npx vercel dev
```

This will:
- Start the Vite dev server for the frontend
- Run the `/api/ai.ts` serverless function locally
- Read environment variables from `.env.local`

The first time you run `vercel dev`, it will ask you to:
1. Link to a Vercel project (you can skip this or link to your GitHub repo)
2. Set up the project (accept defaults)

Then it will start on `http://localhost:3000` (or another port).

## Step 4: Alternative - Use Vite Dev Server with Proxy (Not Recommended)

If `vercel dev` doesn't work well, you can run Vite normally, but the API functions won't work locally. You'll need to:

1. Deploy to Vercel to test API functions, OR
2. Set up a local proxy (more complex)

## For Production Deployment on Vercel

When deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add: `DEEPSEEK_API_KEY` = `your_api_key`
4. Redeploy your project

## Troubleshooting

### "AI service not configured" error:
- Make sure `.env.local` exists in the project root
- Make sure `DEEPSEEK_API_KEY` is set correctly
- If using `vercel dev`, restart the server after adding the env variable
- Check that the API key is valid at https://platform.deepseek.com/

### API functions not working:
- Make sure you're using `vercel dev` (not just `npm run dev`)
- The `/api/ai.ts` function only works with Vercel CLI or on Vercel deployment
- Regular `vite dev` cannot run Vercel serverless functions

### Port conflicts:
- Vercel dev usually runs on port 3000
- If port 3000 is taken, it will use the next available port
- Check the terminal output for the actual URL

