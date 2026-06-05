const dotenv = require('dotenv');
dotenv.config();

const { supabase } = require('./lib/repo');
const { getProjectById } = require('./controllers/projectController');
const { getTaskById } = require('./controllers/taskController');

async function testTaskMapping() {
  console.log('--- STARTING TASK MAPPING INTEGRATION TEST ---');

  // 1. Fetch a valid project (preferring one with tasks)
  let project = null;
  const { data: aiProjects } = await supabase.from('projects').select('*').eq('name', 'AI Verification Project').limit(1);
  if (aiProjects && aiProjects.length > 0) {
    project = aiProjects[0];
  } else {
    const { data: projects, error: projectError } = await supabase.from('projects').select('*').limit(1);
    if (projectError || !projects || projects.length === 0) {
      console.error('Failed to find any project:', projectError);
      process.exit(1);
    }
    project = projects[0];
  }
  console.log(`Testing with project: ${project.name} (${project.id})`);

  // 2. Fetch the project owner as the test user
  const { data: userRow, error: userError } = await supabase.from('users').select('*').eq('id', project.owner_id).single();
  if (userError || !userRow) {
    console.error('Failed to find the project owner in database:', userError);
    process.exit(1);
  }
  const user = userRow;
  console.log(`Found project owner user: ${user.name} (${user.id})`);

  // Mock request/response for getProjectById
  const reqProject = { params: { id: project.id }, user: { _id: user.id } };
  let jsonProject = null;
  const resProject = {
    status: function() { return this; },
    json: function(data) { jsonProject = data; return this; }
  };

  try {
    console.log('Executing getProjectById...');
    await getProjectById(reqProject, resProject);

    if (jsonProject && jsonProject.tasks) {
      console.log(`\nFound ${jsonProject.tasks.length} tasks in project details response.`);
      if (jsonProject.tasks.length > 0) {
        const task = jsonProject.tasks[0];
        console.log('Sample task keys:', Object.keys(task));
        console.log('Does task have _id?:', task._id !== undefined);
        console.log('Does task have dueDate?:', task.dueDate !== undefined);
        console.log('task._id:', task._id);
        console.log('task.dueDate:', task.dueDate);
        console.log('task.due_date:', task.due_date);
      }
    } else {
      console.error('getProjectById response did not return tasks.');
    }
  } catch (err) {
    console.error('Error in getProjectById:', err);
  }

  // 3. Fetch a single task via getTaskById
  const { data: tasks, error: taskError } = await supabase.from('tasks').select('*').limit(1);
  if (tasks && tasks.length > 0) {
    const taskRecord = tasks[0];
    const reqTask = { params: { id: taskRecord.id }, user: { _id: user.id } };
    let jsonTask = null;
    const resTask = {
      status: function() { return this; },
      json: function(data) { jsonTask = data; return this; }
    };

    try {
      console.log('\nExecuting getTaskById...');
      await getTaskById(reqTask, resTask);

      if (jsonTask) {
        console.log('Single task keys:', Object.keys(jsonTask));
        console.log('Does task have _id?:', jsonTask._id !== undefined);
        console.log('Does task have dueDate?:', jsonTask.dueDate !== undefined);
        console.log('task.dueDate:', jsonTask.dueDate);
      }
    } catch (err) {
      console.error('Error in getTaskById:', err);
    }
  }

  console.log('\n--- TEST COMPLETE ---');
  process.exit(0);
}

testTaskMapping();
