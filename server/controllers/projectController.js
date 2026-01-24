const Project = require('../models/Project');
const Task = require('../models/Task');
const Team = require('../models/Team');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const asyncHandler = require('../middleware/asyncHandler');

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// @desc    Get all projects for the logged-in user
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { team: { $in: req.user.teams } }],
  })
    .populate('owner', 'name email')
    .populate({ // Populate team with its members' names and emails
      path: 'team',
      select: 'name members', // Select team name and members
      populate: {
        path: 'members',
        select: 'name email', // Select member name and email
      },
    })
    .populate({ // Populate tasks with status and assignee details
      path: 'tasks',
      select: 'status', // Include status for progress calculation
      populate: {
        path: 'assignee',
        select: 'name email',
      },
    });

  res.json(projects);
});

// @desc    Create a new project with AI-generated tasks
// @route   POST /api/projects/ai
// @access  Private
const createProjectWithAI = asyncHandler(async (req, res) => {
  const { name, goal, dueDate, teamId } = req.body;

  if (!name || !goal) {
    res.status(400);
    throw new Error('Project name and goal are required');
  }

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `You are an expert project manager with 20 years of experience in software development and project planning. Your task is to create a detailed, hierarchical project plan based on the following user-provided goal.

**Project Goal:** "${goal}"

**Instructions:**

1.  **Analyze the Goal:** Carefully analyze the project goal to understand its core requirements, deliverables, and constraints.
2.  **Deconstruct into Phases:** Break down the project into a series of high-level phases (e.g., Planning, Design, Development, Testing, Deployment). The project should have at least 4-6 distinct phases.
3.  **Generate Detailed Tasks:** For each phase, create a list of detailed tasks. Each task must be a clear, actionable item. The description for each task must be extremely descriptive, providing all necessary details so that no other source is needed to understand and execute the task.
4.  **Create Sub-Tasks:** For complex tasks, break them down further into a list of sub-tasks. Each sub-task should be a small, manageable unit of work. The description for each sub-task must be extremely descriptive, providing all necessary details so that no other source is needed to understand and execute the sub-task.
5.  **Estimate Duration:** Provide a realistic duration in days for each task and sub-task.
6.  **Identify Dependencies:** For each task and sub-task, identify any dependencies on other tasks. Dependencies should be listed as an array of task names.
7.  **Set Priority:** Assign a priority to each task (\`High\`, \`Medium\`, or \`Low\`).
8.  **State Assumptions:** For each phase, list any assumptions you are making.
9.  **Generate JSON Output:** Your final output MUST be a single, valid JSON object with a \`tasks\` array. Ensure all string values within the JSON are properly escaped (e.g., double quotes, newlines). Do not include any other text or explanations outside of the JSON object. If any content cannot be properly escaped or formatted, you must omit it to ensure the JSON remains valid.

**JSON Schema:**

Your JSON output must follow this structure:

\`\`\`json
{
  "tasks": [
    {
      "name": "Phase 1: Project Initiation and Planning",
      "description": "This phase involves setting up the project, defining the scope, and creating a detailed plan.",
      "duration": 5,
      "priority": "High",
      "assumptions": [
        "The project team is available.",
        "The project budget is approved."
      ],
      "dependencies": [],
      "subtasks": [
        {
          "name": "Define Project Scope and Objectives",
          "description": "Create a detailed project scope document that outlines the goals, deliverables, features, functions, tasks, deadlines, and costs.",
          "duration": 2,
          "priority": "High",
          "dependencies": [],
          "subtasks": []
        },
        {
          "name": "Develop Project Plan",
          "description": "Create a comprehensive project plan that includes a timeline, resource plan, communication plan, and risk management plan.",
          "duration": 3,
          "priority": "High",
          "dependencies": ["Define Project Scope and Objectives"],
          "subtasks": []
        }
      ]
    }
  ]
}
\`\`\`

**Example:**

Here is a small example for a simple project like "Build a personal portfolio website":

\`\`\`json
{
  "tasks": [
    {
      "name": "Phase 1: Design",
      "description": "Design the visual layout and user experience of the portfolio website.",
      "duration": 3,
      "priority": "High",
      "assumptions": [],
      "dependencies": [],
      "subtasks": [
        {
          "name": "Create Wireframes",
          "description": "Create low-fidelity wireframes for each page of the website.",
          "duration": 1,
          "priority": "High",
          "dependencies": [],
          "subtasks": []
        },
        {
          "name": "Create Mockups",
          "description": "Create high-fidelity mockups based on the wireframes.",
          "duration": 2,
          "priority": "High",
          "dependencies": ["Create Wireframes"],
          "subtasks": []
        }
      ]
    },
    {
      "name": "Phase 2: Development",
      "description": "Develop the front-end and back-end of the portfolio website.",
      "duration": 7,
      "priority": "High",
      "assumptions": [],
      "dependencies": ["Phase 1: Design"],
      "subtasks": [
        {
          "name": "Setup Development Environment",
          "description": "Set up the local development environment, including a code editor, version control, and any necessary dependencies.",
          "duration": 1,
          "priority": "High",
          "dependencies": [],
          "subtasks": []
        },
        {
          "name": "Build UI Components",
          "description": "Build the UI components for the website based on the mockups.",
          "duration": 4,
          "priority": "High",
          "dependencies": ["Setup Development Environment"],
          "subtasks": []
        }
      ]
    }
  ]
}
\`\`\``,
      },
    ],
    model: 'openai/gpt-oss-120b',
    response_format: { type: "json_object" },
  });

  const roadmap = JSON.parse(chatCompletion.choices[0]?.message?.content);
  const taskData = Array.isArray(roadmap) ? roadmap : roadmap.tasks || roadmap.roadmap || [];

  const project = new Project({
    name,
    goal,
    dueDate,
    team: teamId,
    owner: req.user._id,
  });

  const createdProject = await project.save();

  const allTasks = [];
  const taskNameToIdMap = new Map();

  async function createTasks(tasks, parentId = null) {
    const createdTasks = [];
    // First pass: Create tasks without dependencies to populate the name->ID map.
    for (const task of tasks) {
            const newTask = new Task({
              name: task.name,
              description: task.description,
              duration: task.duration,
              priority: task.priority,
              assumptions: task.assumptions,
              dependencies: [], // Handled in the second pass
              team: teamId,
              project: createdProject._id,
              owner: req.user._id,
              parent: parentId,
            });
      const createdTask = await newTask.save();
      createdTasks.push(createdTask);
      allTasks.push(createdTask);
      taskNameToIdMap.set(task.name, createdTask._id);
    }

    // Second pass: Now that the map is populated, handle dependencies and subtasks.
    for (let i = 0; i < tasks.length; i++) {
      const taskData = tasks[i];
      const createdTask = createdTasks[i];

      if (taskData.dependencies && taskData.dependencies.length > 0) {
        createdTask.dependencies = taskData.dependencies
          .map(depName => taskNameToIdMap.get(depName))
          .filter(depId => depId);
        await createdTask.save();
      }

      if (taskData.subtasks && taskData.subtasks.length > 0) {
        const subtaskIds = await createTasks(taskData.subtasks, createdTask._id);
        createdTask.subTasks = subtaskIds; // Assuming 'subTasks' is the field name in your Task model
        await createdTask.save();
      }
    }
    return createdTasks.map(t => t._id);
  }

  await createTasks(taskData);

  createdProject.tasks = allTasks.filter(t => !t.parent).map(t => t._id);
  await createdProject.save();

  if (teamId) {
    const team = await Team.findById(teamId);
    if (team) {
      team.tasks.push(...allTasks.map(task => task._id));
      team.projects.push(createdProject._id);
      await team.save();
    }
  }

  res.status(201).json(createdProject);
});

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
    // Check if req.params.id is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(404);
        throw new Error('Invalid Project ID');
    }
    const project = await Project.findById(req.params.id)
        .populate({
            path: 'tasks',
            select: 'name status duration priority assignee subTasks', // Explicitly select required fields
            populate: {
                path: 'assignee',
                select: 'name email',
            },
        })
        .populate('owner', 'name email')
        .populate({ // Populate team with its members' names and emails
            path: 'team',
            select: 'name members', // Select team name and members
            populate: {
                path: 'members',
                select: 'name email', // Select member name and email
            },
        });

    if (project) {
        // A function to recursively populate subTasks
        const processedTasks = new Set();
        const populateSubTasks = async (tasks) => {
            for (let i = 0; i < tasks.length; i++) {
                if (tasks[i] && tasks[i].subTasks && tasks[i].subTasks.length > 0) {
                    // Check if the task has already been processed
                    if (processedTasks.has(tasks[i]._id.toString())) {
                        continue; // Skip if already processed
                    }
                    processedTasks.add(tasks[i]._id.toString());

                    tasks[i] = await tasks[i].populate({
                        path: 'subTasks',
                        select: 'name status duration priority assignee subTasks',
                        populate: {
                            path: 'assignee',
                            select: 'name email',
                        }
                    });
                    await populateSubTasks(tasks[i].subTasks);
                }
            }
        };

        await populateSubTasks(project.tasks);
        res.json(project);
    } else {
        res.status(404);
        throw new Error('Project not found');
    }
});

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (project) {
    if (project.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized as project owner');
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: project._id });

    await project.deleteOne();
    res.json({ message: 'Project removed' });
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

// @desc    Create a new empty project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const { name, goal, dueDate, teamId } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Project name is required');
  }

  const project = new Project({
    name,
    goal,
    dueDate,
    team: teamId,
    owner: req.user._id,
    tasks: [], // Explicitly set tasks to an empty array
  });

  const createdProject = await project.save();

  if (teamId) {
    const team = await Team.findById(teamId);
    if (team) {
      team.projects.push(createdProject._id);
      await team.save();
    }
  }

  res.status(201).json(createdProject);
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = asyncHandler(async (req, res) => {
  const { name, goal, dueDate, teamId } = req.body;

  const project = await Project.findById(req.params.id);

  if (project) {
    if (project.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this project');
    }

    project.name = name || project.name;
    project.goal = goal || project.goal;
    project.dueDate = dueDate || project.dueDate;
    project.team = teamId || project.team;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

module.exports = {
  getProjects,
  createProjectWithAI,
  getProjectById,
  deleteProject,
  createProject,
  updateProject,
};