const Task = require('../models/Task');
const Team = require('../models/Team');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { name, description, duration, dependencies, assignee, status, team, project } = req.body;

  const task = new Task({
    name,
    description,
    duration,
    dependencies,
    assignee,
    status,
    team,
    project,
    owner: req.user._id,
  });

  const createdTask = await task.save();
  res.status(201).json(createdTask);
});

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({
    $or: [{ assignee: req.user._id }, { owner: req.user._id }],
  }).populate('assignee', 'name email');
  res.json(tasks);
});

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
    // Check if req.params.id is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(404);
        throw new Error('Invalid Task ID');
    }
    const task = await Task.findById(req.params.id).populate('assignee', 'name email');

    if (task) {
        res.json(task);
    } else {
        res.status(404);
        throw new Error('Task not found');
    }
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
    // Check if req.params.id is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(404);
        throw new Error('Invalid Task ID');
    }
    const { name, description, duration, dependencies, assignee, status } = req.body;

    const task = await Task.findById(req.params.id);

    if (task) {
        task.name = name || task.name;
        task.description = description || task.description;
        task.duration = duration || task.duration;
        task.dependencies = dependencies || task.dependencies;
        task.assignee = assignee || task.assignee;
        task.status = status || task.status;

        const updatedTask = await task.save();
        res.json(updatedTask);
    } else {
        res.status(404);
        throw new Error('Task not found');
    }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
    // Check if req.params.id is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(404);
        throw new Error('Invalid Task ID');
    }
    const task = await Task.findById(req.params.id);

    if (task) {
        if (task.owner.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized as task owner');
        }
        await task.deleteOne(); // Use deleteOne instead of deprecated remove()
        res.json({ message: 'Task removed' });
    } else {
        res.status(404);
        throw new Error('Task not found');
    }
});


module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};