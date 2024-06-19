import { v4 as uuidv4 } from 'uuid';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/todoapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Todo Schema and Model
const TodoSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
});

const Todo = mongoose.model('Todo', TodoSchema);

// User Schema and Model
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    todos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],
});

const User = mongoose.model('User', UserSchema);

const app = express();
app.use(express.json());

const JWT_SECRET = 'your-secure-jwt-secret'; // Replace with a strong, random secret key

// Middleware to authenticate JWT tokens
const authorize = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send('Forbidden: No token provided');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Unauthorized: Invalid token');
        }
        req.user = decoded;
        next();
    });
};

// Validation rules for creating/updating todos
const validateTodo = [
    body('title').isString().withMessage('Title must be a string').notEmpty().withMessage('Title is required'),
    body('description').isString().withMessage('Description must be a string').notEmpty().withMessage('Description is required'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
];

// Create a new Todo
app.post("/todo", authorize, validateTodo, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const todo = new Todo({
        id: uuidv4(),
        title: req.body.title,
        description: req.body.description,
    });

    await todo.save();
    res.status(201).json(todo);
});

// Get all Todos
app.get("/todos", authorize, async (req: Request, res: Response) => {
    const todos = await Todo.find();
    res.json(todos);
});

// Get a Todo by ID
app.get("/todo/:id", authorize, async (req: Request, res: Response) => {
    const todo = await Todo.findOne({ id: req.params.id });
    if (!todo) {
        res.status(404).send(`To-Do item with id=${req.params.id} not found`);
    } else {
        res.json(todo);
    }
});

// Update a Todo by ID
app.put("/todo/:id", authorize, validateTodo, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const todo = await Todo.findOne({ id: req.params.id });
    if (!todo) {
        res.status(404).send(`To-Do item with id=${req.params.id} not found`);
    } else {
        todo.title = req.body.title ?? todo.title;
        todo.description = req.body.description ?? todo.description;
        todo.completed = req.body.completed ?? todo.completed;
        todo.updatedAt = new Date();

        await todo.save();
        res.json(todo);
    }
});

// Delete a Todo by ID
app.delete("/todo/:id", authorize, async (req: Request, res: Response) => {
    const todo = await Todo.findOneAndDelete({ id: req.params.id });
    if (!todo) {
        res.status(404).send(`To-Do item with id=${req.params.id} not found`);
    } else {
        res.json(todo);
    }
});

// User registration endpoint
app.post("/register", [
    body('username').isString().withMessage('Username must be a string').notEmpty().withMessage('Username is required'),
    body('password').isString().withMessage('Password must be a string').notEmpty().withMessage('Password is required'),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
        username,
        password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
});

// User login endpoint
app.post("/login", [
    body('username').isString().withMessage('Username must be a string').notEmpty().withMessage('Username is required'),
    body('password').isString().withMessage('Password must be a string').notEmpty().withMessage('Password is required'),
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
