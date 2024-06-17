# Decentralized To-Do List Canister

## Description
A decentralized to-do list application built on the Internet Computer using TypeScript and Azle.

## Installation
1. Clone the repository: `git clone https://github.com/maagyei04/unique_icp_canister_to_do_app.git`
2. Navigate to the project directory: `cd unique_icp_canister_to_do_app`
3. Install dependencies: `npm install`

## Usage
1. Start the Internet Computer local replica: `dfx start --host 127.0.0.1:8000 --clean --background`
2. Deploy the canister: `dfx deploy`
3. Interact with the canister:
   ```sh
   dfx canister call unique_todo_canister addTodo '( "Write a new canister", "Create a new canister for the ICP course" )'
   dfx canister call unique_todo_canister getTodo '( "1" )'
   dfx canister call unique_todo_canister getAllTodos '()'
   dfx canister call unique_todo_canister updateTodo '( "1", opt "Test the canister", opt true )'
   dfx canister call unique_todo_canister deleteTodo '( "1" )'
