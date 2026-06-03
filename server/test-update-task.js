const dotenv = require('dotenv');
dotenv.config();

const { supabase } = require('./lib/repo');
const { updateTask } = require('./controllers/taskController');

async function testTaskUpdate() {
  console.log('--- STARTING TASK UPDATE INTEGRATION TEST ---');
  
  // 1. Fetch a valid user
  const { data: users, error: userError } = await supabase.from('users').select('*').limit(1);
  if (userError || !users || users.length === 0) {
    console.error('Failed to find a user in database:', userError);
    process.exit(1);
  }
  const user = users[0];
  console.log(`Found test user: ${user.name} (${user.id})`);

  // 2. Fetch a valid task
  const { data: tasks, error: taskError } = await supabase.from('tasks').select('*').limit(1);
  if (taskError || !tasks || tasks.length === 0) {
    console.error('Failed to find a task in database:', taskError);
    process.exit(1);
  }
  const task = tasks[0];
  console.log(`Found test task: ${task.name} (${task.id})`);

  // Mock Request with both dueDate and subTasks to simulate the ProjectScreen/TaskSideDrawer payload
  const req = {
    params: {
      id: task.id
    },
    body: {
      ...task,
      dueDate: '2026-12-31',
      subTasks: [] // Client often passes subTasks
    },
    user: {
      _id: user.id
    }
  };

  // Mock Response
  let statusResult = null;
  let jsonResult = null;
  const res = {
    status: function(code) {
      statusResult = code;
      return this;
    },
    json: function(data) {
      jsonResult = data;
      return this;
    }
  };

  try {
    console.log('Calling updateTask handler...');
    await updateTask(req, res);

    console.log('\n--- RESPONSE STATUS ---');
    console.log(statusResult || 200);

    console.log('\n--- RESPONSE JSON ---');
    console.log(JSON.stringify(jsonResult, null, 2));

    if (jsonResult && jsonResult.id) {
      console.log('\nTask updated successfully in database!');
    } else {
      console.error('\nTask update did not return the task object.');
    }

  } catch (err) {
    console.error('Error executing handler:', err);
  }

  console.log('\n--- TEST COMPLETE ---');
  process.exit(0);
}

testTaskUpdate();
