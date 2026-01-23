const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    goal: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strictPopulate: false, // Temporarily set to false
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;