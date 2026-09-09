const jsonServer = require('json-server')
const jsonServerAuth = require('json-server-auth')
const path = require('path')
const fs = require('fs')

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const distPath = path.resolve(__dirname, 'dist')
const indexPath = path.join(distPath, 'index.html')

// 1. Vincular router db a la app para jsonServerAuth
server.db = router.db

// 2. Middlewares estándar de json-server (CORS, logger, bodyParser) y archivos estáticos
const middlewares = jsonServer.defaults({
  static: distPath
})
server.use(middlewares)

// 3. Fallback para SPA en Vue Router (HTML5 History Mode)
// Si el navegador solicita una página HTML o una ruta que no es de la API, servimos index.html
server.use((req, res, next) => {
  const isHtmlRequest = req.headers.accept && req.headers.accept.includes('text/html')
  const isApiCollection = ['/users', '/medicos', '/citas'].some(ep => req.path.startsWith(ep))
  const isStaticAsset = req.path.startsWith('/assets') || req.path.includes('.')

  if (req.method === 'GET' && (isHtmlRequest || (!isApiCollection && !isStaticAsset))) {
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath)
    }
  }
  next()
})

// 4. Middleware de autenticación (POST /login, POST /register)
server.use(jsonServerAuth)

// 5. Router de la base de datos (GET, POST, PUT, DELETE para /users, /medicos, /citas)
server.use(router)

const PORT = process.env.PORT || 3000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Servidor SaludPlus corriendo en el puerto ${PORT}`)
})
