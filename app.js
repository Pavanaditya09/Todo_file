const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  const data = await db.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoData = `SELECT * FROM todo WHERE id = ${todoId};`
  const data = await db.get(todoData)
  response.send(data)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const todoQuery = `INSERT INTO todo (id,todo,priority,status) VALUES (${id},'${todo}','${priority}','${status}');`
  const data = await db.run(todoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updatemessage = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updatemessage = 'Status'
      break
    case requestBody.priority !== undefined:
      updatemessage = 'Priority'
      break
    case requestBody.todo !== undefined:
      updatemessage = 'Todo'
      break
    default:
      updatemessage = ''
  }
  const prevData = `SELECT * FROM todo WHERE id= ${todoId};`
  const preview = await db.get(prevData)
  const {
    todo = preview.todo,
    priority = preview.priority,
    status = preview.status,
  } = request.body
  const updateQuery = `UPDATE todo SET todo ='${todo}',priority='${priority}',status='${status}' WHERE id=${todoId};`
  await db.run(updateQuery)
  response.send(`${updatemessage} Updated`)
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `DELETE FROM  todo WHERE id=${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
