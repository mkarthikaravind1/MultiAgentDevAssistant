# Todo App
A simple todo app built with FastAPI and SQLite.

## Getting Started
1. Clone the repository: `git clone https://github.com/your-username/todo-app.git`
2. Change into the directory: `cd todo-app`
3. Build the Docker image: `docker build -t todo-app .`
4. Run the Docker container: `docker run -p 8000:8000 todo-app`
5. Open a web browser and navigate to `http://localhost:8000/docs` to access the API documentation.

## API Endpoints
* `GET /tasks/`: Retrieve a list of all tasks.
* `GET /tasks/{task_id}`: Retrieve a single task by ID.
* `POST /tasks/`: Create a new task.
* `PUT /tasks/{task_id}`: Update a single task by ID.
* `DELETE /tasks/{task_id}`: Delete a single task by ID.
* `GET /users/`: Retrieve a list of all users.
* `GET /users/{user_id}`: Retrieve a single user by ID.
* `POST /users/`: Create a new user.
* `PUT /users/{user_id}`: Update a single user by ID.
* `DELETE /users/{user_id}`: Delete a single user by ID.