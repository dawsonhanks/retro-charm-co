import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Serves /api/* handlers during `npm run dev` the same way Vercel does in production.
 * Without this, Vite returns an empty 404 for /api/create-checkout and the cart
 * throws "Unexpected end of JSON input" when parsing the response.
 */
function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/create-checkout') {
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

          const mod = await server.ssrLoadModule('/api/create-checkout.js')
          const handler = mod.default
          if (typeof handler !== 'function') {
            throw new Error('create-checkout handler is not exported')
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
            res.end(JSON.stringify({ error: 'Checkout handler returned no response' }))
          }
        } catch (error) {
          console.error('[local-api/create-checkout]', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: error?.message || 'Failed to create checkout',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (not only VITE_*) so the local API can read Square secrets.
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
