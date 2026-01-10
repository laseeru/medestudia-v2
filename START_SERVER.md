# Starting the Development Server

## Quick Start

1. **Open Terminal** in this directory:
   ```bash
   cd /Users/abdulrashiddasana/Desktop/MedEstudia-v2/medestudia-ayuda-pro
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to:
   ```
   http://localhost:8080
   ```

## Troubleshooting

### If you see "ERR_CONNECTION_REFUSED":

1. **Check if the server is actually running**:
   - Look at your terminal - you should see output like:
     ```
     VITE v5.x.x  ready in xxx ms
     ➜  Local:   http://localhost:8080/
     ```

2. **Check if port 8080 is already in use**:
   ```bash
   lsof -i :8080
   ```
   If something is using it, kill that process or change the port in `vite.config.ts`

3. **Check for errors in terminal**:
   - Look for any red error messages
   - Common issues:
     - Missing dependencies → run `npm install`
     - TypeScript errors → check terminal output
     - Port already in use → change port or kill process

### If npm install fails:

Try:
```bash
npm cache clean --force
npm install
```

### To test AI features:

Create `.env.local` file in project root:
```
DEEPSEEK_API_KEY=your_api_key_here
```

Then restart the server.

