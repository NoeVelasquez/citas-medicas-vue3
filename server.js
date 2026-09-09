const jsonServer = require('json-server')
const jsonServerAuth = require('json-server-auth')
const path = require('path')
const express = require('express')

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServerAuth)

// Vincular router db a la app
server.db = router.db
server.use(router)

// Servir frontend compilado en producción (dist)
const distPath = path.join(__dirname, 'dist')
server.use(express.static(distPath))
server.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 3000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Servidor SaludPlus corriendo en el puerto ${PORT}`)
})
