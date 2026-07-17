# Skill-Sharing Feature Backend

This is a standalone backend utility directory designed for the new **Skill-Sharing & Matchmaking** feature of Collaborate.

## Architecture

This feature is built as a modular utility script that connects directly to the Supabase PostgreSQL database to perform complex grouping, searching, and peer matching of users based on their registered tech stacks and teach/learn skillsets. 

The key components are:
* **`db.js`**: Connects to the Supabase client using environment variables.
* **`skillGrouper.js`**: Core module containing helper functions for:
  - Grouping users under skills.
  - Grouping skills under users.
  - Matching users (finding potential mentors and learners).
  - Searching/filtering users with complex criteria (AND/OR logic, teach/learn types).
* **`cli.js`**: Command-line application to run, inspect, and test these functionalities in real time.
* **`test.js`**: Basic connectivity and logic verification script.

## Getting Started

1. Ensure the dependencies are installed (run `npm install` inside this folder).
2. Configure `.env` file with the Supabase credentials (a copy is pre-configured with the project's development database).

## Command Line Interface (CLI) Usage

You can execute the utility from the terminal inside this folder:

### 1. View Help
```bash
node cli.js --help
```

### 2. View Database Stats
```bash
node cli.js --stats
```

### 3. Group People by Skill
List all skills in the system and show which users possess them:
```bash
node cli.js --group-by-skill
```

### 4. Group Skills by User
List all users and show their tech stack / can-teach / want-to-learn skills:
```bash
node cli.js --group-by-user
```

### 5. Find Mentorship / Learner Matches
Find other users who can teach the skills a target user wants to learn, or want to learn the skills a target user teaches:
```bash
node cli.js --match <USER_UUID>
```

### 6. Complex Search/Filter
Search for users who have specific skills:
```bash
# Users who have Python OR React
node cli.js --search "Python, React"

# Users who have BOTH Python AND React (AND query)
node cli.js --search "Python, React" --match-all

# Users who can TEACH Python AND React
node cli.js --search "Python, React" --match-all --type can_teach
```

## Running Verification Tests

Run the test suite to ensure database connectivity and module functionality:
```bash
npm test
```
