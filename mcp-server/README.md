# Vaiz MCP Server

> Model Context Protocol (MCP) server for Vaiz API - enables AI assistants like Claude and Cursor to interact with your Vaiz workspace

[![npm version](https://badge.fury.io/js/vaiz-mcp-server.svg)](https://badge.fury.io/js/vaiz-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## About

This MCP server provides AI assistants with direct access to the [Vaiz](https://vaiz.com) project management platform. It enables LLMs to:

- 📋 Create, read, and update tasks
- 📄 Manage documents and content
- 💬 Post and read comments
- 📊 Access projects, boards, and milestones
- 👥 View team members and profiles
- 🖼️ Download and analyze images from tasks and attachments

Built on the [Model Context Protocol](https://modelcontextprotocol.io/), this server works with any MCP-compatible AI assistant, including Claude Desktop, Cursor, and more.

## Features

- ✅ **30 powerful tools** for complete Vaiz API access
- ✅ **10 built-in documentation resources** for AI self-learning
- ✅ **Full TypeScript support** with type safety
- ✅ **Simple setup** with environment variables
- ✅ **Works with Cursor, Claude Desktop**, and other MCP clients
- ✅ **Built on official Vaiz SDK** for reliability

## Prerequisites

- Node.js >= 18.0.0
- A Vaiz account with API access
- Vaiz API key and Space ID ([Get them here](https://vaiz.com/settings/api))

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g vaiz-mcp-server
```

### Option 2: Install from source

```bash
git clone https://github.com/vaizcom/vaiz-node-sdk.git
cd vaiz-node-sdk/mcp-server
npm install
npm run build
npm link
```

## Configuration

### Get Your Vaiz API Credentials

1. Log in to [Vaiz](https://vaiz.com)
2. Go to Settings → API
3. Generate an API key
4. Copy your Space ID

### Set Up Environment Variables

Create a `.env` file in your home directory or project root:

```env
VAIZ_API_KEY=your_api_key_here
VAIZ_SPACE_ID=your_space_id_here
VAIZ_VERBOSE=false  # Optional: set to 'true' for debug logging
```

Alternatively, export them in your shell:

```bash
export VAIZ_API_KEY="your_api_key_here"
export VAIZ_SPACE_ID="your_space_id_here"
```

## Usage with Cursor

### 1. Configure Cursor

Add the server to your Cursor settings. Open Cursor Settings → Features → Model Context Protocol:

```json
{
  "mcpServers": {
    "vaiz": {
      "command": "vaiz-mcp-server",
      "env": {
        "VAIZ_API_KEY": "your_api_key_here",
        "VAIZ_SPACE_ID": "your_space_id_here"
      }
    }
  }
}
```

Or if installed from source:

```json
{
  "mcpServers": {
    "vaiz": {
      "command": "node",
      "args": ["/path/to/vaiz-node-sdk/mcp-server/dist/index.js"],
      "env": {
        "VAIZ_API_KEY": "your_api_key_here",
        "VAIZ_SPACE_ID": "your_space_id_here"
      }
    }
  }
}
```

### 2. Restart Cursor

After adding the configuration, restart Cursor to load the MCP server.

### 3. Start Using Vaiz Tools

Now you can ask Cursor to interact with Vaiz:

- "Show me all my tasks"
- "Create a task called 'Implement login feature' in project X"
- "What are the details of TASK-123?"
- "Add a comment to TASK-456 saying 'Great work!'"
- "List all documents in the current project"

## Usage with Claude Desktop

### 1. Configure Claude Desktop

Edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the server configuration:

```json
{
  "mcpServers": {
    "vaiz": {
      "command": "vaiz-mcp-server",
      "env": {
        "VAIZ_API_KEY": "your_api_key_here",
        "VAIZ_SPACE_ID": "your_space_id_here"
      }
    }
  }
}
```

### 2. Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

### 3. Verify Connection

Look for the 🔌 icon in Claude Desktop indicating MCP tools are available.

## Available Tools

The server provides the following tools:

### Tasks
- **get_tasks** - Get a list of tasks with optional filtering
- **clear_tasks_cache** - Clear the tasks cache to force refresh task data
- **get_task** - Get detailed information about a specific task
- **create_task** - Create a new task
- **get_history** - Get history of changes for a task or other entity
- **set_task_blocker** - Set a blocking relationship between two tasks
- **edit_task** - Update an existing task

### Projects & Boards
- **get_projects** - Get all projects in the workspace
- **get_project** - Get detailed project information
- **get_boards** - Get all boards in the workspace
- **create_board_group** - Create a new board group (column) on a board
- **edit_board_group** - Edit an existing board group (column)
- **create_board_type** - Create a new board type (task type) on a board
- **edit_board_type** - Edit an existing board type (task type)
- **get_milestones** - Get milestones for a specific project
- **create_milestone** - Create a new milestone in a project

### Documents
- **get_documents** - Get a list of documents
- **get_document** - Get a specific document with metadata
- **get_document_content** - Get the JSON content structure of a document (works for task descriptions too)
- **create_document** - Create a new document
- **append_to_document** - Append content to an existing document
- **replace_document** - Replace document content with HTML/Markdown
- **replace_json_document** - Replace document content with structured JSON (for interactive checklists, tables, etc.)
- **append_json_document** - Append content to document using JSON structure

> **📖 Document Content Examples**: See [MCP_DOCUMENT_EXAMPLES.md](../MCP_DOCUMENT_EXAMPLES.md) for detailed examples of document structures and how to create interactive checklists.

### Comments
- **post_comment** - Post a comment on a task, document, etc.
- **get_comments** - Get comments for a specific entity
- **edit_comment** - Edit a comment
- **delete_comment** - Soft delete a comment
- **add_reaction** - Add a popular emoji reaction to a comment

### User & Space
- **get_profile** - Get current user's profile
- **get_space** - Get information about a specific space
- **get_space_members** - Get all members in the current space

### Files & Images
- **download_image** - Download an image from URL and return it for analysis. The image is automatically downloaded, returned as base64, and the temporary file is automatically deleted. Perfect for analyzing task attachments, screenshots, and external images.

## Built-in Documentation Resources

The MCP server includes 10 built-in documentation resources that AI can read to better understand how to use the Vaiz SDK:

### Available Resources
- 📖 **Quick Start Guide** - Get started with Vaiz SDK quickly
- 🛠️ **Environment Setup** - Configure development environment
- 🔄 **Common Patterns** - Pagination, caching, and ID management
- 📝 **Working with Documents** - Document hierarchies and content management
- 🌍 **Real-World Scenarios** - Complete examples for common use cases
- ⚡ **Performance Tips** - Optimize SDK usage for better performance
- 🔗 **Integration Patterns** - Webhooks and external system sync
- 🚨 **Error Handling** - Robust error handling strategies
- 🎯 **Vaiz MCP Usage Guide** - How to use the MCP server effectively
- 📄 **Markdown Formatting Guide** - Format documents with Markdown

AI assistants can access these resources automatically to provide better help and guidance when working with Vaiz.

## Important Notes

### ⚠️ Using Member IDs for Task Assignees

When assigning tasks to users, always use the `Member.id` field from `get_space_members`, NOT `_id` or other fields.

**Correct:**
```json
{
  "assignees": ["67890123456789abcdef0123"]  // Member.id
}
```

**Incorrect:**
```json
{
  "assignees": ["member._id"]  // ❌ Wrong - internal MongoDB field
}
```

For more details, see [ASSIGNEES_FIX.md](./ASSIGNEES_FIX.md).

## Example Conversations

### Example 1: Create and assign a task

> **You**: "Create a high-priority task called 'Fix login bug' and assign it to john@example.com"

The AI will:
1. Use `get_space_members` to find the member with email john@example.com
2. Extract the `Member.id` field
3. Use `create_task` with that ID in the `assignees` array

### Example 2: Update task status

> **You**: "Mark TASK-456 as completed"

The AI will use `edit_task` to update the task status.

### Example 2.5: Set up task blocking relationships

> **You**: "Make TASK-123 block TASK-456"

The AI will use `set_task_blocker` to create a blocking relationship where TASK-123 blocks TASK-456. This means TASK-456 cannot be completed until TASK-123 is done.

### Example 3: Document collaboration

> **You**: "Create a document called 'API Documentation' and add a section about authentication"

The AI will use `create_document` and `append_to_document`.

### Example 4: Analyze task attachments

> **You**: "Download the image from TASK-123 and analyze what's in the screenshot"

The AI will:
1. Use `get_task` to get the task details and file attachments
2. Use `download_image` to download the image (it will be automatically returned as base64 and the temporary file will be automatically deleted)
3. Analyze the image to describe its contents

**Note**: The MCP server automatically handles temporary file cleanup - images are downloaded, converted to base64, returned for analysis, and then the temporary files are immediately deleted.

## Troubleshooting

### Server not connecting

1. Verify your API key and Space ID are correct
2. Check that the server is installed: `which vaiz-mcp-server`
3. Test the server manually: `VAIZ_API_KEY=xxx VAIZ_SPACE_ID=yyy vaiz-mcp-server`
4. Check Cursor/Claude logs for error messages

### Authentication errors

- Make sure your API key is valid and not expired
- Verify the Space ID matches your workspace
- Check that your API key has the necessary permissions

### Tools not appearing

- Restart your AI assistant application
- Verify the MCP server configuration is in the correct format
- Check the application logs for MCP connection errors

## Development

```bash
# Clone the repository
git clone https://github.com/vaizcom/vaiz-node-sdk.git
cd vaiz-node-sdk/mcp-server

# Install dependencies
npm install

# Build the server
npm run build

# Run in development mode
npm run dev
```

## Publishing to npm

### Prerequisites

1. npm account: Create one at [npmjs.com](https://www.npmjs.com/signup)
2. Login to npm: `npm login`
3. Verify your email on npm

### Publishing Steps

```bash
# 1. Navigate to the MCP server directory
cd mcp-server

# 2. Update version in package.json (use semantic versioning)
# For first release, it's already 0.1.0

# 3. Build the project
npm run build

# 4. Test the package locally
npm pack
# This creates a .tgz file you can test

# 5. Publish to npm
npm publish --access public

# For subsequent releases:
# npm version patch  # for bug fixes (0.1.0 -> 0.1.1)
# npm version minor  # for new features (0.1.0 -> 0.2.0)
# npm version major  # for breaking changes (0.1.0 -> 1.0.0)
# npm publish
```

### Publishing Checklist

- [ ] All tests pass
- [ ] README is complete and accurate
- [ ] Version number is updated
- [ ] LICENSE file is included
- [ ] Built files are in dist/ directory
- [ ] package.json has correct metadata
- [ ] .npmignore or "files" field is configured

## Architecture

```
┌─────────────────┐
│  AI Assistant   │
│ (Cursor/Claude) │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│  MCP Server     │
│  (This package) │
└────────┬────────┘
         │ Vaiz SDK
         │
┌────────▼────────┐
│   Vaiz API      │
│ (api.vaiz.com)  │
└─────────────────┘
```

## Security

- **Never commit your API keys** to version control
- Use environment variables for sensitive data
- Rotate API keys periodically
- Grant minimum necessary permissions to API keys

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request
