# INDIA_LEGAL_BE

## Scripts

1. npm run dev - run development server with nodemon

## Folder Structure

1- Root folder container directory src which contains all the modules and app related scripts along with server.js (entry point of the app) and package.json (contains the list of all the dependencies and other app related stuff).

2- SRC directory contains two subdirectories
2.1- App -> Contains all the modules and common functions.
2.2- Config -> Contains all the environment configurations.

3- Now coming inside the App subdirectory:
3.1 It contains two directories:-
a- common -> contains all the scripts which can used multiple times in our code.
b- modules -> contains all the modules

## Modules directory breakdown:-

`4.1- Each module contains basically 5 files and one directory containing all the request validation :-`

`a- <moduleName>.controller.js - handles all the request and response.`

`b- <moduleName>.model.js - database schema`

`c- <moduleName>.routes.js - all the api routes of the module`

`d- <moduleName>.service.js - contains all the busines logic`

`e- <moduleName>.validators.js - contains all the logic related to request validation.`
