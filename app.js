const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//1.
app.get("/todos/", async (request, response) => {
  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };

  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority = "", status = "" } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//2.
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE id=${todoId};`;
  const todoResponse = await db.get(getTodoQuery);
  response.send(todoResponse);
});

//3.
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
    INSERT INTO todo(id,todo,priority,status)
    VALUES(
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );`;
  const dbResponse = await db.run(createTodoQuery);
  const todoId = dbResponse.lastID;

  response.send("Todo Successfully Added");
});

//4.
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const { todo = "", priority = "", status = "" } = request.body;

  const hasStatusProperty = (requestBody) => {
    return requestBody.status !== undefined;
  };

  const hasPriorityProperty = (requestBody) => {
    return requestBody.priority !== undefined;
  };

  const hasTodoProperty = (requestBody) => {
    return requestBody.todo !== undefined;
  };

  switch (true) {
    case hasStatusProperty(request.body):
      const updateStatusTodoQuery = `
             UPDATE todo 
             SET 
              status='${status}'
               WHERE id=${todoId};`;
      const statusData = await db.run(updateStatusTodoQuery);
      response.send("Status Updated");
      break;

    case hasPriorityProperty(request.body):
      const updatePriorityTodoQuery = `
                UPDATE todo
                SET 
                    priority='${priority}'
                     WHERE id=${todoId};`;
      const priorityData = await db.run(updatePriorityTodoQuery);
      response.send("Priority Updated");
      break;

    case hasTodoProperty(request.body):
      const updateTodoQuery = `
                UPDATE todo
                SET 
                    todo='${todo}'
                    WHERE id=${todoId};`;
      const todoData = await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

//5.
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
   DELETE FROM todo WHERE id=${todoId};`;
  const deletedTodo = await db.get(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
