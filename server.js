const jsonServer = require('json-server')
const jsonServerAuth = require('json-server-auth')
const path = require('path')
const fs = require('fs')

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const distPath = path.join(__dirname, 'dist')

// Configurar middlewares para que la raíz estática sea la carpeta dist compilada de Vue 3
const middlewares = jsonServer.defaults({
  static: distPath
})

server.use(middlewares)
server.use(jsonServerAuth)

// Vincular router db a la app
server.db = router.db
server.use(router)

// Fallback para SPA en Vue Router (HTML5 History Mode)
server.use((req, res, next) => {
  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    next()
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Servidor SaludPlus corriendo en el puerto ${PORT}`)
})
