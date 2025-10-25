# Intelligent Engineering Platform - Quick Start Guide

## 🚀 Getting Started

### Access the Application

**Frontend URL**: http://intelligent-engineering-platform-frontend.s3-website-us-east-1.amazonaws.com

**API Base URL**: https://imuoni3n40.execute-api.us-east-1.amazonaws.com/dev

## 📱 Using the Application

### 1. Create an Account

1. Navigate to the frontend URL
2. Click on "Register" or "Sign Up"
3. Fill in your details:
   - Name
   - Email address
   - Password (minimum 8 characters)
4. Click "Create Account"
5. You'll be automatically logged in

### 2. Create Your First Project

1. After logging in, click "New Project" or "Create Project"
2. Fill in the project details:
   - **Project Name**: Give your project a descriptive name
   - **Description**: Describe what you're building
   - **Requirements**: List your project requirements
   - **Constraints**: Any limitations or constraints
   - **Disciplines**: Select relevant engineering disciplines
   - **Development Mode**: Choose between rapid, balanced, or thorough
3. Click "Create Project"

### 3. Explore Project Features

#### Phase Management
- View all project phases (Planning, Design, Development, Testing, Deployment)
- Generate AI-powered content for each phase
- Track phase progress and status
- Edit phase outputs

#### Team Collaboration
- Invite team members to your project
- Assign roles and permissions
- View active team members
- Track team activity

#### Task Management
- Create and assign tasks
- Update task status (To Do, In Progress, Completed)
- Set priorities and due dates
- Filter tasks by status or assignee

#### Analytics Dashboard
- View project progress metrics
- Track team performance
- Monitor completion rates
- Identify bottlenecks and risks

#### Templates
- Browse pre-built project templates
- Generate projects from templates
- Customize template settings
- Save time on project setup

### 4. Generate AI Content

1. Navigate to a project phase
2. Click "Generate Content" or the AI icon
3. The system will generate phase-specific content based on:
   - Project requirements
   - Selected disciplines
   - Development mode
   - Phase objectives
4. Review and edit the generated content
5. Save changes

### 5. Export Your Project

1. Open your project
2. Click "Export" or the download icon
3. Choose your export format:
   - PDF Document
   - Word Document
   - PowerPoint Presentation
   - Markdown
4. Click "Export"
5. Download the generated file

## 🔧 API Usage

### Authentication

#### Register a New User
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Projects

#### Create a Project
```bash
POST /projects
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "My Engineering Project",
  "description": "Building an innovative solution",
  "requirements": "Must be scalable and secure",
  "constraints": "Budget: $50k, Timeline: 3 months",
  "disciplines": ["Software Engineering", "Systems Engineering"],
  "developmentMode": "balanced"
}
```

#### List Projects
```bash
GET /projects
Authorization: Bearer <your-token>
```

#### Get Project Details
```bash
GET /projects/{projectId}
Authorization: Bearer <your-token>
```

### Templates

#### List Available Templates
```bash
GET /templates
Authorization: Bearer <your-token>
```

#### Generate Project from Template
```bash
POST /templates/generate
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "templateId": "template_web_app",
  "projectName": "My Web Application",
  "customizations": {
    "requirements": "Custom requirements here",
    "disciplines": ["Software Engineering", "UI/UX Design"]
  }
}
```

### Team Management

#### Get Team Members
```bash
GET /team/{projectId}/members
Authorization: Bearer <your-token>
```

#### Invite Team Member
```bash
POST /team/{projectId}/invite
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "email": "teammate@example.com",
  "role": "developer"
}
```

### Tasks

#### Get Project Tasks
```bash
GET /tasks/project/{projectId}
Authorization: Bearer <your-token>
```

#### Assign Task
```bash
POST /tasks/assign
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "projectId": "project-id",
  "title": "Implement feature X",
  "description": "Detailed description",
  "assignedTo": "user-id",
  "priority": "high",
  "dueDate": "2025-02-01T00:00:00Z"
}
```

### Analytics

#### Get Project Analytics
```bash
GET /projects/{projectId}/analytics?range=30d
Authorization: Bearer <your-token>
```

#### Get Comparative Analytics
```bash
GET /analytics/comparative
Authorization: Bearer <your-token>
```

## 💡 Tips and Best Practices

### Project Setup
1. **Be Specific**: Provide detailed requirements and constraints for better AI-generated content
2. **Choose Disciplines Carefully**: Select only relevant disciplines to keep the project focused
3. **Set Realistic Timelines**: Use the development mode that matches your timeline and resources

### Team Collaboration
1. **Assign Clear Roles**: Give team members specific roles and responsibilities
2. **Regular Updates**: Keep task statuses updated for accurate progress tracking
3. **Use Comments**: Add comments to phases and tasks for better communication

### AI Content Generation
1. **Review and Edit**: Always review AI-generated content and customize it for your needs
2. **Iterate**: Generate content multiple times with different settings if needed
3. **Save Versions**: Keep track of different versions of generated content

### Analytics and Reporting
1. **Monitor Regularly**: Check analytics dashboard weekly to track progress
2. **Address Risks Early**: Act on identified risks before they become blockers
3. **Export Reports**: Generate reports for stakeholders and documentation

## 🐛 Troubleshooting

### Cannot Login
- Verify your email and password are correct
- Check if you've registered an account
- Clear browser cache and cookies
- Try registering a new account

### API Errors
- Ensure you're using the correct API URL
- Check that your authentication token is valid
- Verify the request format matches the API documentation
- Check the browser console for detailed error messages

### Content Not Generating
- Verify you have a valid authentication token
- Check that the project has all required fields filled
- Try refreshing the page and generating again
- Check the browser console for errors

### Export Not Working
- Ensure the project has content to export
- Check your browser's download settings
- Try a different export format
- Verify you have sufficient permissions

## 📞 Support

For additional help or to report issues:
1. Check the DEPLOYMENT_STATUS.md file for known limitations
2. Review the API documentation
3. Contact the development team

## 🔄 Updates and Maintenance

The platform is regularly updated with new features and improvements. Check the deployment status document for the latest updates and feature releases.

---

**Last Updated**: January 2025
**Version**: 1.0.0 (Development)
