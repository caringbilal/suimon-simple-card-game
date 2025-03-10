# AWS Deployment Structure

This document outlines the new directory structure for AWS deployment.

## Current Structure
The project is currently organized with mixed frontend and backend files. We need to separate these for better AWS deployment management.

## New Structure
We will reorganize the project into the following structure:

```
suimon-game/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── database/
│   └── services/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── other frontend files
```

## Migration Steps
1. Create main project folder (suimon-game)
2. Create backend and frontend subdirectories
3. Move server-related files to backend:
   - server.js
   - database setup
   - server package.json
4. Move React app files to frontend:
   - src directory
   - public directory
   - frontend package.json
   - other React-related files
5. Update import paths and dependencies
6. Test the separated applications

## AWS CodePipeline Setup
After reorganizing, we'll set up AWS CodePipeline with:
- Separate pipelines for frontend and backend
- Automated testing and deployment
- Environment variable management
- Proper security configurations