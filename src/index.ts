import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

class Todo {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date | null;
}

const todoStorage = StableBTreeMap<string, Todo>(0);

export default Server(() => {
    const app = express();
    app.use(express.json());

    app.post("/todo", (req, res) => {
        const todo: Todo = { 
            id: uuidv4(), 
            title: req.body.title, 
            description: req.body.description, 
            completed: false, 
            createdAt: getCurrentDate(), 
            updatedAt: null 
        };
        todoStorage.insert(todo.id, todo);
        res.json(todo);
    });

    app.get("/todos", (req, res) => {
        res.json(todoStorage.values());
    });

    app.get("/todo/:id", (req, res) => {
        const todoId = req.params.id;
        const todoOpt = todoStorage.get(todoId);
        if ("None" in todoOpt) {
            res.status(404).send(`To-Do item with id=${todoId} not found`);
        } else {
            res.json(todoOpt.Some);
        }
    });

    app.put("/todo/:id", (req, res) => {
        const todoId = req.params.id;
        const todoOpt = todoStorage.get(todoId);
        if ("None" in todoOpt) {
            res.status(404).send(`To-Do item with id=${todoId} not found`);
        } else {
            const todo = todoOpt.Some;
            todo.title = req.body.title ?? todo.title;
            todo.description = req.body.description ?? todo.description;
            todo.completed = req.body.completed ?? todo.completed;
            todo.updatedAt = getCurrentDate();
            todoStorage.insert(todoId, todo);
            res.json(todo);
        }
    });

    app.delete("/todo/:id", (req, res) => {
        const todoId = req.params.id;
        const deletedTodo = todoStorage.remove(todoId);
        if ("None" in deletedTodo) {
            res.status(404).send(`To-Do item with id=${todoId} not found`);
        } else {
            res.json(deletedTodo.Some);
        }
    });

    return app.listen();
});

function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}
