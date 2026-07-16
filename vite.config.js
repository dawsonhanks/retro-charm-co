import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const LOCAL_API_ROUTES = {
  '/api/create-checkout': '/api/create-checkout.js',
  '/api/email-signup': '/api/email-signup.js',
}

/**
 * Serves /api/* handlers during `npm run dev` the same way Vercel does in production.
 * Without this, Vite returns an empty 404 for API routes and the client
 * throws when parsing the response.
 */
function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        const modulePath = url ? LOCAL_API_ROUTES[url] : null
        if (!modulePath) {
          next()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const chunks = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const raw = Buffer.concat(chunks).toString('utf8')
          let body = {}
          if (raw) {
            try {
              body = JSON.parse(raw)
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid JSON body' }))
              return
            }
          }

          const mod = await server.ssrLoadModule(modulePath)
          const handler = mod.default
          if (typeof handler !== 'function') {
            throw new Error(`${modulePath} handler is not exported`)
          }

          let responded = false
          const mockRes = {
            statusCode: 200,
            status(code) {
              this.statusCode = code
              return this
            },
            json(data) {
              if (responded) return
              responded = true
              res.statusCode = this.statusCode
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            },
          }

          await handler({ method: 'POST', body, headers: req.headers }, mockRes)

          if (!responded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'API handler returned no response' }))
          }
        } catch (error) {
          console.error(`[local-api${url}]`, error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: error?.message || 'API request failed',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (not only VITE_*) so the local API can read server secrets.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return {
    plugins: [react(), tailwindcss(), localApiPlugin()],
  }
})
