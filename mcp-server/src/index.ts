#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
} from '@modelcontextprotocol/sdk/types.js';
import { VaizClient, Kind } from 'vaiz-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const VAIZ_API_KEY = process.env.VAIZ_API_KEY;
const VAIZ_SPACE_ID = process.env.VAIZ_SPACE_ID;

if (!VAIZ_API_KEY || !VAIZ_SPACE_ID) {
  console.error('Error: VAIZ_API_KEY and VAIZ_SPACE_ID must be set in environment variables');
  process.exit(1);
}

// Initialize Vaiz client
const vaizClient = new VaizClient({
  apiKey: VAIZ_API_KEY,
  spaceId: VAIZ_SPACE_ID,
  verbose: process.env.VAIZ_VERBOSE === 'true',
});

// Define available tools
const tools: Tool[] = [
  {
    name: 'get_tasks',
    description:
      'Get a list of tasks from Vaiz with optional filtering. Returns tasks with their details including name, status, priority, assignees, and more. Supports filtering by IDs, board, project, assignees, completion status, and more. Results are cached for 5 minutes - use clear_tasks_cache to force refresh.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by specific task IDs',
        },
        board: {
          type: 'string',
          description: 'Filter tasks by board ID',
        },
        project: {
          type: 'string',
          description: 'Filter tasks by project ID',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Filter tasks by assignee member IDs (use Member.id from vaiz_get_space_members)',
        },
        parentTask: {
          type: 'string',
          description: 'Filter by parent task ID (to get subtasks)',
        },
        milestones: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter tasks by milestone IDs',
        },
        completed: {
          type: 'boolean',
          description: 'Filter by completion status (true for completed, false for incomplete)',
        },
        archived: {
          type: 'boolean',
          description: 'Filter by archived status (true for archived, false for active)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tasks to return (1-50, default: 50)',
        },
        skip: {
          type: 'number',
          description: 'Number of tasks to skip for pagination (default: 0)',
        },
      },
    },
  },
  {
    name: 'clear_tasks_cache',
    description:
      'Clear the tasks cache. Use this when you need to force refresh task data after making changes (creating, editing, or deleting tasks). The cache is automatically cleared after 5 minutes, but this method allows immediate cache invalidation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_task',
    description:
      "Get detailed information about a specific task by its slug (e.g., 'TASK-123'). Returns complete task details including description, custom fields, comments count, and attachments.",
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: "The task slug (e.g., 'TASK-123')",
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'create_task',
    description:
      'Create a new task in Vaiz. Returns the created task with its assigned slug and ID.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Task name/title',
        },
        board: {
          type: 'string',
          description: 'Board ID where the task will be created',
        },
        group: {
          type: 'string',
          description: 'Group ID (optional)',
        },
        project: {
          type: 'string',
          description: 'Project ID (optional)',
        },
        description: {
          type: 'string',
          description: 'Task description (optional)',
        },
        priority: {
          type: 'string',
          description: "Task priority: 'urgent', 'high', 'normal', or 'low' (optional)",
        },
        completed: {
          type: 'boolean',
          description: 'Completion status (default: false)',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Array of member IDs to assign to the task (use Member.id from vaiz_get_space_members, NOT _id)',
        },
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Task type IDs',
        },
        parentTask: {
          type: 'string',
          description: 'Parent task ID (for creating subtasks)',
        },
        subtasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Subtask IDs',
        },
        milestones: {
          type: 'array',
          items: { type: 'string' },
          description: 'Milestone IDs',
        },
        dueStart: {
          type: 'string',
          description: 'Start date in ISO format (e.g., "2025-01-01T00:00:00Z")',
        },
        dueEnd: {
          type: 'string',
          description: 'Due date in ISO format (e.g., "2025-01-31T23:59:59Z")',
        },
        blockers: {
          type: 'array',
          items: { type: 'string' },
          description:
            'DEPRECATED: Use leftConnectors instead. Task IDs that block this task. Note: The Vaiz API uses leftConnectors/rightConnectors, not blockers/blocking.',
        },
        blocking: {
          type: 'array',
          items: { type: 'string' },
          description:
            'DEPRECATED: Use rightConnectors instead. Task IDs that this task blocks. Note: The Vaiz API uses leftConnectors/rightConnectors, not blockers/blocking.',
        },
        leftConnectors: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Task IDs that block this task (blockers). Use this instead of blockers parameter.',
        },
        rightConnectors: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Task IDs that this task blocks (blocking). Use this instead of blocking parameter.',
        },
      },
      required: ['name', 'board'],
    },
  },
  {
    name: 'get_history',
    description:
      'Get history of changes for a task or other entity. Returns a list of all changes made to the entity. Each history entry contains creatorId field - use get_space_members to get member details and display the author name (member.fullName) for each change. Always include the author information when presenting history to the user.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          description: 'Entity type (e.g., "Task", "Document", "Project")',
        },
        kindId: {
          type: 'string',
          description: 'Entity ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of history entries to return (optional)',
        },
        offset: {
          type: 'number',
          description: 'Number of entries to skip (optional)',
        },
      },
      required: ['kind', 'kindId'],
    },
  },
  {
    name: 'set_task_blocker',
    description:
      "Set a blocking relationship between two tasks. This will add the blocker to the blocked task's blockers list and add the blocked task to the blocker's blocking list. Both tasks will be updated atomically.",
    inputSchema: {
      type: 'object',
      properties: {
        blockedTaskId: {
          type: 'string',
          description:
            "The ID of the task that is being blocked (can use HRID like 'TASK-123' or database ID)",
        },
        blockerTaskId: {
          type: 'string',
          description:
            "The ID of the task that blocks the other task (can use HRID like 'TASK-456' or database ID)",
        },
      },
      required: ['blockedTaskId', 'blockerTaskId'],
    },
  },
  {
    name: 'edit_task',
    description:
      'Edit an existing task. Can update name, description, priority, assignees, completion status, and other fields. Only provide fields you want to update.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: "The task ID to edit (can use HRID like 'TASK-123' or database ID)",
        },
        name: {
          type: 'string',
          description: 'New task name',
        },
        group: {
          type: 'string',
          description: 'New group ID (board column) to move the task to',
        },
        description: {
          type: 'string',
          description: 'New task description',
        },
        priority: {
          type: 'string',
          description: "New task priority: 'urgent', 'high', 'normal', or 'low'",
        },
        completed: {
          type: 'boolean',
          description: 'New completion status (true for completed, false for incomplete)',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description:
            'New array of member IDs to assign (use Member.id from vaiz_get_space_members, NOT _id)',
        },
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'New task type IDs',
        },
        parentTask: {
          type: 'string',
          description: 'New parent task ID',
        },
        subtasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'New subtask IDs',
        },
        milestones: {
          type: 'array',
          items: { type: 'string' },
          description: 'New milestone IDs',
        },
        dueStart: {
          type: 'string',
          description: 'New start date in ISO format',
        },
        dueEnd: {
          type: 'string',
          description: 'New due date in ISO format',
        },
        blockers: {
          type: 'array',
          items: { type: 'string' },
          description:
            'DEPRECATED: Use leftConnectors instead. Task IDs that block this task. Note: The Vaiz API uses leftConnectors/rightConnectors, not blockers/blocking.',
        },
        blocking: {
          type: 'array',
          items: { type: 'string' },
          description:
            'DEPRECATED: Use rightConnectors instead. Task IDs that this task blocks. Note: The Vaiz API uses leftConnectors/rightConnectors, not blockers/blocking.',
        },
        leftConnectors: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Task IDs that block this task (blockers). Use this instead of blockers parameter.',
        },
        rightConnectors: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Task IDs that this task blocks (blocking). Use this instead of blocking parameter.',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'get_projects',
    description:
      'Get all projects in the workspace. Returns a list of projects with their IDs, names, and metadata.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_project',
    description: 'Get detailed information about a specific project by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_documents',
    description:
      'Get a list of documents filtered by scope (Space/Member/Project) and scope ID. Returns documents with their metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          description: 'Document scope: "Project", "Space", or "Member"',
          enum: ['Project', 'Space', 'Member'],
        },
        kindId: {
          type: 'string',
          description: 'ID of the project/space/member',
        },
      },
      required: ['kind', 'kindId'],
    },
  },
  {
    name: 'get_document',
    description: 'Get a specific document by its ID. Returns the document with its full content.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The document ID',
        },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'create_document',
    description: 'Create a new document in Vaiz. Returns the created document with its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          description: 'Document scope: "Project", "Space", or "Member"',
          enum: ['Project', 'Space', 'Member'],
        },
        kindId: {
          type: 'string',
          description: 'ID of the project/space/member',
        },
        title: {
          type: 'string',
          description: 'Document title',
        },
        index: {
          type: 'number',
          description: 'Position in document list (use 0 for first position)',
        },
        parentDocumentId: {
          type: 'string',
          description: 'Optional parent document ID for nesting',
        },
      },
      required: ['kind', 'kindId', 'title', 'index'],
    },
  },
  {
    name: 'append_to_document',
    description:
      'Append content to an existing document. The content will be added at the end of the document. IMPORTANT: For task descriptions (document attached to tasks), use vaiz_append_json_document instead, as this method does not work for task descriptions. Plain text/Markdown only - HTML is NOT supported.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The document ID',
        },
        content: {
          type: 'string',
          description: 'Plain text or Markdown content to append (HTML is NOT supported)',
        },
      },
      required: ['documentId', 'content'],
    },
  },
  {
    name: 'replace_document',
    description:
      'Replace the entire content of an existing document. Plain text/Markdown only - HTML is NOT supported. For task descriptions, prefer vaiz_replace_json_document for better formatting and rich content support.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The document ID',
        },
        content: {
          type: 'string',
          description: 'Plain text or Markdown content to replace with (HTML is NOT supported)',
        },
      },
      required: ['documentId', 'content'],
    },
  },
  {
    name: 'replace_json_document',
    description:
      'Replace document content with JSON structure. Use this for creating interactive checklists, tables, and other rich content. RECOMMENDED for task descriptions and any document requiring rich formatting. Requires proper document node structure.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The document ID',
        },
        content: {
          type: 'array',
          description:
            'Array of document nodes (heading, paragraph, taskList, etc.) in proper JSON structure',
          items: {
            type: 'object',
          },
        },
      },
      required: ['documentId', 'content'],
    },
  },
  {
    name: 'append_json_document',
    description:
      'Append content to document using JSON structure. RECOMMENDED for task descriptions - use this instead of vaiz_append_to_document when working with task descriptions, as plain text append does not work for task documents. Supports rich formatting including links, bold text, lists, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The document ID',
        },
        content: {
          type: 'array',
          description:
            'Array of document nodes to append (heading, paragraph, taskList, etc.) in proper JSON structure',
          items: {
            type: 'object',
          },
        },
      },
      required: ['documentId', 'content'],
    },
  },
  {
    name: 'get_document_content',
    description:
      'Get the JSON content structure of a document. Works for task descriptions, standalone documents, and any document by ID. Returns the parsed JSON structure of the document content.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The document ID (can be task description ID or standalone document ID)',
        },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'post_comment',
    description:
      'Post a comment to a document in Vaiz. Supports HTML content, file attachments, and replies.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'Document ID to comment on',
        },
        content: {
          type: 'string',
          description:
            'Comment content (HTML supported). To mention a user, use: <block-custom-mention-v2 custom="1" inline="true" data="{&quot;item&quot;:{&quot;id&quot;:&quot;USER_ID&quot;,&quot;kind&quot;:&quot;User&quot;}}"></block-custom-mention-v2>',
        },
        fileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of file IDs to attach',
        },
        replyTo: {
          type: 'string',
          description: 'Optional parent comment ID for replies',
        },
      },
      required: ['documentId', 'content'],
    },
  },
  {
    name: 'get_comments',
    description: 'Get all comments for a document.',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'Document ID',
        },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'edit_comment',
    description: 'Edit a comment. Can update content and manage file attachments.',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: {
          type: 'string',
          description: 'Comment ID to edit',
        },
        content: {
          type: 'string',
          description:
            'New comment content (HTML supported). To mention a user, use: <block-custom-mention-v2 custom="1" inline="true" data="{&quot;item&quot;:{&quot;id&quot;:&quot;USER_ID&quot;,&quot;kind&quot;:&quot;User&quot;}}"></block-custom-mention-v2>',
        },
        addFileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'File IDs to add',
        },
        orderFileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'New order of file IDs',
        },
        removeFileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'File IDs to remove',
        },
      },
      required: ['commentId', 'content'],
    },
  },
  {
    name: 'delete_comment',
    description: 'Soft delete a comment.',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: {
          type: 'string',
          description: 'Comment ID to delete',
        },
      },
      required: ['commentId'],
    },
  },
  {
    name: 'add_reaction',
    description: 'Add a popular emoji reaction to a comment (THUMBS_UP, HEART, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: {
          type: 'string',
          description: 'Comment ID',
        },
        reaction: {
          type: 'string',
          description: 'Reaction type (e.g., THUMBS_UP, HEART, LAUGH, SAD, SURPRISED, ANGRY)',
        },
      },
      required: ['commentId', 'reaction'],
    },
  },
  {
    name: 'get_profile',
    description: "Get the current user's profile information.",
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_space',
    description: 'Get information about a specific space.',
    inputSchema: {
      type: 'object',
      properties: {
        spaceId: {
          type: 'string',
          description: 'The space ID (optional, uses configured space if not provided)',
        },
      },
    },
  },
  {
    name: 'get_space_members',
    description: 'Get all members in the current space.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_boards',
    description: 'Get all boards in the workspace.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_board_group',
    description:
      'Create a new board group (column) on a board. Returns the created group information.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the group (e.g., "To do", "In progress", "Done")',
        },
        boardId: {
          type: 'string',
          description: 'Board ID where the group will be created',
        },
        boardTypeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of board type IDs to associate with this group',
        },
      },
      required: ['name', 'boardId'],
    },
  },
  {
    name: 'edit_board_group',
    description:
      'Edit an existing board group (column). Can update name and associated task types.',
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'string',
          description: 'ID of the group to edit',
        },
        boardId: {
          type: 'string',
          description: 'Board ID',
        },
        name: {
          type: 'string',
          description: 'New name for the group',
        },
        boardTypeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'New array of board type IDs to associate with this group',
        },
      },
      required: ['groupId', 'boardId'],
    },
  },
  {
    name: 'create_board_type',
    description:
      'Create a new board type (task type) on a board. Types define categories like Bug, Feature, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the type (e.g., "Bug", "Feature", "Task")',
        },
        boardId: {
          type: 'string',
          description: 'Board ID where the type will be created',
        },
        icon: {
          type: 'string',
          description: 'Icon for the type (optional)',
        },
        color: {
          type: 'string',
          description: 'Color for the type in hex format (e.g., "#FF5733") (optional)',
        },
      },
      required: ['name', 'boardId'],
    },
  },
  {
    name: 'edit_board_type',
    description: 'Edit an existing board type (task type). Can update name, icon, and color.',
    inputSchema: {
      type: 'object',
      properties: {
        typeId: {
          type: 'string',
          description: 'ID of the type to edit',
        },
        boardId: {
          type: 'string',
          description: 'Board ID',
        },
        name: {
          type: 'string',
          description: 'New name for the type',
        },
        icon: {
          type: 'string',
          description: 'New icon for the type',
        },
        color: {
          type: 'string',
          description: 'New color for the type in hex format',
        },
      },
      required: ['typeId', 'boardId'],
    },
  },
  {
    name: 'get_milestones',
    description: 'Get milestones for a specific project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'create_milestone',
    description: 'Create a new milestone in a project.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Milestone name',
        },
        project: {
          type: 'string',
          description: 'Project ID',
        },
        board: {
          type: 'string',
          description: 'Board ID',
        },
        dueStart: {
          type: 'string',
          description: 'Start date in ISO format (e.g., "2025-01-01T00:00:00Z")',
        },
        dueEnd: {
          type: 'string',
          description: 'Due date in ISO format (e.g., "2025-12-31T23:59:59Z")',
        },
        description: {
          type: 'string',
          description: 'Milestone description (optional)',
        },
        color: {
          type: 'string',
          description: 'Color name (default: "blue")',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for the milestone',
        },
      },
      required: ['name', 'project', 'board'],
    },
  },
  {
    name: 'download_image',
    description:
      'Download an image from URL and return it for analysis. The image is automatically downloaded, converted to base64, returned for analysis, and the temporary file is automatically deleted. This allows you to analyze images from Vaiz (e.g., task attachments, comment attachments) or any external URL.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to download and analyze',
        },
        localPath: {
          type: 'string',
          description:
            'Optional: Custom temporary path where to save the image before analysis (default: /tmp/vaiz-image-{timestamp}.png). The file will be automatically deleted after analysis.',
        },
      },
      required: ['imageUrl'],
    },
  },
];

// Define available resources (documentation guides)
const resources: Resource[] = [
  {
    uri: 'vaiz://guides/quick-start',
    name: 'Quick Start Guide',
    description: 'Get started with Vaiz SDK quickly',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/environment-setup',
    name: 'Environment Setup',
    description: 'Configure your development environment for Vaiz SDK',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/common-patterns',
    name: 'Common Patterns',
    description: 'Pagination, caching, and ID management patterns',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/working-with-documents',
    name: 'Working with Documents',
    description: 'Document hierarchies and content management',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/real-world-scenarios',
    name: 'Real-World Scenarios',
    description: 'Complete examples for common use cases',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/performance-tips',
    name: 'Performance Tips',
    description: 'Optimize your SDK usage for better performance',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/integration-patterns',
    name: 'Integration Patterns',
    description: 'Webhooks and external system synchronization',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/error-handling',
    name: 'Error Handling',
    description: 'Robust error handling strategies for production',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/vaiz-mcp-usage',
    name: 'Vaiz MCP Usage Guide',
    description: 'How to use the Vaiz MCP server effectively',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vaiz://guides/markdown-formatting',
    name: 'Markdown Formatting Guide',
    description: 'Formatting documents with Markdown in Vaiz',
    mimeType: 'text/markdown',
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'vaiz-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle list resources request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources };
});

// Handle read resource request
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // Map of resource content
  const resourceContent: Record<string, string> = {
    'vaiz://guides/quick-start': `# Quick Start Guide

## Installation

\`\`\`bash
npm install vaiz-sdk
\`\`\`

## Basic Usage

\`\`\`typescript
import { VaizClient } from 'vaiz-sdk';

const client = new VaizClient({
  apiKey: 'your-api-key',
  spaceId: 'your-space-id',
});

// Get tasks
const tasks = await client.getTasks({ limit: 10 });

// Create a task
const task = await client.createTask({
  name: 'My first task',
  board: 'board-id',
});
\`\`\`

For more examples, see [Vaiz SDK Documentation](https://docs-python-sdk.vaiz.com/)`,

    'vaiz://guides/environment-setup': `# Environment Setup

## Prerequisites
- Node.js >= 16.0.0
- Vaiz API key and Space ID

## Configuration

Create a \`.env\` file:
\`\`\`env
VAIZ_API_KEY=your_api_key_here
VAIZ_SPACE_ID=your_space_id_here
\`\`\`

## Using Environment Variables

\`\`\`typescript
import * as dotenv from 'dotenv';
dotenv.config();

const client = new VaizClient({
  apiKey: process.env.VAIZ_API_KEY!,
  spaceId: process.env.VAIZ_SPACE_ID!,
});
\`\`\`

Learn more: https://docs-python-sdk.vaiz.com/patterns/environment-setup`,

    'vaiz://guides/common-patterns': `# Common Patterns

## Pagination

\`\`\`typescript
// Get tasks with pagination
const tasks = await client.getTasks({
  limit: 50,
  skip: 0,
});

// Next page
const nextTasks = await client.getTasks({
  limit: 50,
  skip: 50,
});
\`\`\`

## ID Management

**Important**: When assigning tasks, use \`Member.id\` (NOT \`_id\`):

\`\`\`typescript
const members = await client.getSpaceMembers();
const memberId = members.members[0].id; // Use .id

await client.createTask({
  name: 'Task',
  board: 'board-id',
  assignees: [memberId], // Correct!
});
\`\`\`

## Caching

\`\`\`typescript
// Clear cache when needed
client.clearTasksCache();
\`\`\`

Learn more: https://docs-python-sdk.vaiz.com/patterns/common-patterns`,

    'vaiz://guides/working-with-documents': `# Working with Documents

## Document Structure

\`\`\`typescript
import { heading, paragraph, bulletList } from 'vaiz-sdk';

const content = [
  heading(1, 'Title'),
  paragraph('Some text'),
  bulletList('Item 1', 'Item 2'),
];

await client.replaceJsonDocument({
  documentId: 'doc-id',
  content,
});
\`\`\`

## Task Descriptions

For task descriptions, use JSON methods:

\`\`\`typescript
// Get task description content
const task = await client.getTask('TASK-123');
const content = await client.getJsonDocument(task.task.document);

// Update task description
await client.appendJsonDocument({
  documentId: task.task.document,
  content: [paragraph('New content')],
});
\`\`\`

Learn more: https://docs-python-sdk.vaiz.com/patterns/working-with-documents`,

    'vaiz://guides/real-world-scenarios': `# Real-World Scenarios

## Scenario 1: Daily Standup Report

\`\`\`typescript
// Get yesterday's completed tasks
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const tasks = await client.getTasks({
  completed: true,
  assignees: [memberId],
});

// Filter by completion date and generate report
\`\`\`

## Scenario 2: Sprint Planning

\`\`\`typescript
// Create milestone for sprint
const milestone = await client.createMilestone({
  name: 'Sprint 23',
  project: 'project-id',
  board: 'board-id',
  dueStart: '2025-01-01T00:00:00Z',
  dueEnd: '2025-01-14T23:59:59Z',
});

// Create sprint tasks
for (const story of stories) {
  await client.createTask({
    name: story.name,
    board: 'board-id',
    milestones: [milestone.milestone.id],
  });
}
\`\`\`

Learn more: https://docs-python-sdk.vaiz.com/patterns/real-world-scenarios`,

    'vaiz://guides/performance-tips': `# Performance Tips

## 1. Use Caching Wisely

\`\`\`typescript
// Cache is valid for 5 minutes
const tasks = await client.getTasks(); // Cached
const tasks2 = await client.getTasks(); // From cache

// Force refresh
client.clearTasksCache();
const freshTasks = await client.getTasks();
\`\`\`

## 2. Batch Operations

\`\`\`typescript
// Good: Batch multiple operations
const [tasks, members, projects] = await Promise.all([
  client.getTasks(),
  client.getSpaceMembers(),
  client.getProjects(),
]);

// Avoid: Sequential calls
const tasks = await client.getTasks();
const members = await client.getSpaceMembers();
const projects = await client.getProjects();
\`\`\`

## 3. Pagination

\`\`\`typescript
// Good: Use pagination
const tasks = await client.getTasks({ limit: 50 });

// Avoid: Loading everything at once
\`\`\`

Learn more: https://docs-python-sdk.vaiz.com/patterns/performance-tips`,

    'vaiz://guides/integration-patterns': `# Integration Patterns

## Webhooks

Vaiz can send webhooks for events. Handle them in your application:

\`\`\`typescript
app.post('/webhook/vaiz', async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'task.created':
      await handleTaskCreated(event.data);
      break;
    case 'task.updated':
      await handleTaskUpdated(event.data);
      break;
  }
  
  res.status(200).send('OK');
});
\`\`\`

## External System Sync

\`\`\`typescript
// Sync from external system to Vaiz
async function syncIssues(externalIssues) {
  for (const issue of externalIssues) {
    await client.createTask({
      name: issue.title,
      board: 'board-id',
      description: issue.description,
    });
  }
}
\`\`\`

Learn more: https://docs-python-sdk.vaiz.com/patterns/integration-patterns`,

    'vaiz://guides/error-handling': `# Error Handling

## SDK Error Types

\`\`\`typescript
import {
  VaizAuthError,
  VaizValidationError,
  VaizNotFoundError,
} from 'vaiz-sdk';

try {
  await client.getTask('INVALID-SLUG');
} catch (error) {
  if (error instanceof VaizAuthError) {
    console.error('Authentication failed');
  } else if (error instanceof VaizValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof VaizNotFoundError) {
    console.error('Task not found');
  }
}
\`\`\`

## Best Practices

1. Always wrap SDK calls in try-catch
2. Log errors for debugging
3. Provide user-friendly error messages
4. Retry on transient failures

\`\`\`typescript
async function retryOperation(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * (i + 1));
    }
  }
}
\`\`\`

Learn more: https://docs-python-sdk.vaiz.com/patterns/error-handling`,

    'vaiz://guides/vaiz-mcp-usage': `# Vaiz MCP Usage Guide

## Available Tools

The Vaiz MCP server provides 30+ tools for interacting with Vaiz:

### Tasks
- \`get_tasks\` - Get list of tasks
- \`get_task\` - Get task details
- \`create_task\` - Create a new task
- \`edit_task\` - Update a task
- \`set_task_blocker\` - Set blocking relationships

### Documents
- \`get_document_content\` - Get document JSON structure
- \`replace_json_document\` - Update document with rich content
- \`append_json_document\` - Append content to document

### Images
- \`download_image\` - Download and analyze images

## Usage Examples

### Creating a Task
"Create a high-priority task called 'Fix login bug' and assign it to john@example.com"

### Analyzing Images
"Download the image from TASK-123 and tell me what's in it"

### Working with Documents
"Update the task description with a checklist of 3 items"

## Tips
1. Use Member.id for assignees (not _id)
2. Images are automatically cleaned up after analysis
3. Use JSON document methods for rich content

Learn more: https://github.com/vaizcom/vaiz-node-sdk/tree/main/mcp-server`,

    'vaiz://guides/markdown-formatting': `# Markdown Formatting Guide

## Document Structure Helpers

\`\`\`typescript
import {
  heading,
  paragraph,
  bulletList,
  orderedList,
  taskList,
  taskItem,
  codeBlock,
  table,
  tableRow,
} from 'vaiz-sdk';
\`\`\`

## Basic Formatting

\`\`\`typescript
// Headings
heading(1, 'Main Title')
heading(2, 'Subtitle')

// Paragraphs
paragraph('Regular text')

// Lists
bulletList('Item 1', 'Item 2', 'Item 3')
orderedList('First', 'Second', 'Third')

// Task lists (checkboxes)
taskList(
  taskItem('Todo item', false),
  taskItem('Done item', true)
)
\`\`\`

## Advanced Features

\`\`\`typescript
// Code blocks
codeBlock('console.log("Hello");', 'javascript')

// Tables
table(
  tableRow(
    tableHeader('Name'),
    tableHeader('Status')
  ),
  tableRow('Task 1', 'Done'),
  tableRow('Task 2', 'In Progress')
)
\`\`\`

## Text Formatting

\`\`\`typescript
import { text } from 'vaiz-sdk';

paragraph(
  text('Bold', true),
  text('Italic', false, true),
  text('Link', false, false, false, 'https://vaiz.com')
)
\`\`\`

Learn more: https://docs-python-sdk.vaiz.com/guides/working-with-documents`,
  };

  const content = resourceContent[uri];

  if (!content) {
    throw new Error(`Resource not found: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: 'text/markdown',
        text: content,
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_tasks': {
        const result = await vaizClient.getTasks(args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'clear_tasks_cache': {
        vaizClient.clearTasksCache();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Tasks cache cleared successfully' },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_task': {
        if (!args?.slug) {
          throw new Error('slug is required');
        }
        const result = await vaizClient.getTask(args.slug as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_history': {
        if (!args?.kind || !args?.kindId) {
          throw new Error('kind and kindId are required');
        }
        const result = await vaizClient.getHistory({
          kind: args.kind as any,
          kindId: args.kindId as string,
          limit: args.limit as number | undefined,
          offset: args.offset as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_task': {
        if (!args?.name || !args?.board) {
          throw new Error('name and board are required');
        }

        // Convert string priority to number
        let priorityNum: number | undefined;
        if (args.priority) {
          const priorityMap: Record<string, number> = {
            low: 0,
            normal: 1,
            medium: 2,
            high: 3,
            urgent: 3,
          };
          priorityNum = priorityMap[args.priority as string] ?? 1;
        }

        // Handle blockers: prefer leftConnectors/rightConnectors, fallback to blockers/blocking
        const leftConnectors =
          (args.leftConnectors as string[] | undefined) || (args.blockers as string[] | undefined);
        const rightConnectors =
          (args.rightConnectors as string[] | undefined) || (args.blocking as string[] | undefined);

        const result = await vaizClient.createTask({
          name: args.name as string,
          board: args.board as string,
          group: args.group as string | undefined,
          project: args.project as string | undefined,
          description: args.description as string | undefined,
          priority: priorityNum as any,
          completed: args.completed as boolean | undefined,
          assignees: args.assignees as string[] | undefined,
          types: args.types as string[] | undefined,
          parentTask: args.parentTask as string | undefined,
          subtasks: args.subtasks as string[] | undefined,
          milestones: args.milestones as string[] | undefined,
          dueStart: args.dueStart as string | undefined,
          dueEnd: args.dueEnd as string | undefined,
          blockers: leftConnectors,
          blocking: rightConnectors,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'set_task_blocker': {
        if (!args?.blockedTaskId || !args?.blockerTaskId) {
          throw new Error('blockedTaskId and blockerTaskId are required');
        }

        const result = await vaizClient.setTaskBlocker({
          blockedTaskId: args.blockedTaskId as string,
          blockerTaskId: args.blockerTaskId as string,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'edit_task': {
        if (!args?.taskId) {
          throw new Error('taskId is required');
        }

        // Convert string priority to number
        let priorityNum: number | undefined;
        if (args.priority) {
          const priorityMap: Record<string, number> = {
            low: 0,
            normal: 1,
            medium: 2,
            high: 3,
            urgent: 3,
          };
          priorityNum = priorityMap[args.priority as string] ?? undefined;
        }

        // Handle blockers: prefer leftConnectors/rightConnectors, fallback to blockers/blocking
        const leftConnectors =
          (args.leftConnectors as string[] | undefined) || (args.blockers as string[] | undefined);
        const rightConnectors =
          (args.rightConnectors as string[] | undefined) || (args.blocking as string[] | undefined);

        const result = await vaizClient.editTask({
          taskId: args.taskId as string,
          name: args.name as string | undefined,
          group: args.group as string | undefined,
          description: args.description as string | undefined,
          priority: priorityNum as any,
          completed: args.completed as boolean | undefined,
          assignees: args.assignees as string[] | undefined,
          types: args.types as string[] | undefined,
          parentTask: args.parentTask as string | undefined,
          subtasks: args.subtasks as string[] | undefined,
          milestones: args.milestones as string[] | undefined,
          dueStart: args.dueStart as string | undefined,
          dueEnd: args.dueEnd as string | undefined,
          blockers: leftConnectors,
          blocking: rightConnectors,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_projects': {
        const result = await vaizClient.getProjects();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_project': {
        if (!args?.projectId) {
          throw new Error('projectId is required');
        }
        const result = await vaizClient.getProject(args.projectId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_documents': {
        if (!args?.kind || !args?.kindId) {
          throw new Error('kind and kindId are required');
        }
        const result = await vaizClient.getDocuments({
          kind: args.kind as Kind,
          kindId: args.kindId as string,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_document': {
        if (!args?.documentId) {
          throw new Error('documentId is required');
        }
        const result = await vaizClient.getDocument(args.documentId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_document': {
        if (!args?.kind || !args?.kindId || !args?.title || args?.index === undefined) {
          throw new Error('kind, kindId, title, and index are required');
        }
        const result = await vaizClient.createDocument({
          kind: args.kind as any,
          kindId: args.kindId as string,
          title: args.title as string,
          index: args.index as number,
          parentDocumentId: args.parentDocumentId as string | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'append_to_document': {
        if (!args?.documentId || !args?.content) {
          throw new Error('documentId and content are required');
        }
        const result = await vaizClient.appendDocument({
          documentId: args.documentId as string,
          content: args.content as string,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'replace_document': {
        if (!args?.documentId || !args?.content) {
          throw new Error('documentId and content are required');
        }
        const result = await vaizClient.replaceDocument({
          documentId: args.documentId as string,
          description: args.content as string,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'replace_json_document': {
        if (!args?.documentId || !args?.content) {
          throw new Error('documentId and content are required');
        }
        const result = await vaizClient.replaceJsonDocument({
          documentId: args.documentId as string,
          content: args.content as any[],
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'append_json_document': {
        if (!args?.documentId || !args?.content) {
          throw new Error('documentId and content are required');
        }
        const result = await vaizClient.appendJsonDocument({
          documentId: args.documentId as string,
          content: args.content as any[],
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_document_content': {
        if (!args?.documentId) {
          throw new Error('documentId is required');
        }
        const result = await vaizClient.getJsonDocument(args.documentId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'post_comment': {
        if (!args?.documentId || !args?.content) {
          throw new Error('documentId and content are required');
        }
        const commentRequest: any = {
          documentId: args.documentId as string,
          content: args.content as string,
        };

        if (args.fileIds) {
          commentRequest.fileIds = args.fileIds as string[];
        }

        if (args.replyTo) {
          commentRequest.replyTo = args.replyTo as string;
        }

        const result = await vaizClient.postComment(commentRequest);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_comments': {
        if (!args?.documentId) {
          throw new Error('documentId is required');
        }
        const result = await vaizClient.getComments({
          documentId: args.documentId as string,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'edit_comment': {
        if (!args?.commentId || !args?.content) {
          throw new Error('commentId and content are required');
        }
        const result = await vaizClient.editComment({
          commentId: args.commentId as string,
          content: args.content as string,
          addFileIds: args.addFileIds as string[] | undefined,
          orderFileIds: args.orderFileIds as string[] | undefined,
          removeFileIds: args.removeFileIds as string[] | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'delete_comment': {
        if (!args?.commentId) {
          throw new Error('commentId is required');
        }
        const result = await vaizClient.deleteComment({
          commentId: args.commentId as string,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'add_reaction': {
        if (!args?.commentId || !args?.reaction) {
          throw new Error('commentId and reaction are required');
        }
        const result = await vaizClient.addReaction({
          commentId: args.commentId as string,
          reaction: args.reaction as any,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_profile': {
        const result = await vaizClient.getProfile();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_space': {
        const spaceId = (args?.spaceId as string) || VAIZ_SPACE_ID;
        const result = await vaizClient.getSpace(spaceId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_space_members': {
        const result = await vaizClient.getSpaceMembers();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_boards': {
        const result = await vaizClient.getBoards();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_board_group': {
        if (!args?.name || !args?.boardId) {
          throw new Error('name and boardId are required');
        }
        const result = await vaizClient.createBoardGroup({
          name: args.name as string,
          boardId: args.boardId as string,
          boardTypeIds: args.boardTypeIds as string[] | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'edit_board_group': {
        if (!args?.groupId || !args?.boardId) {
          throw new Error('groupId and boardId are required');
        }
        const result = await vaizClient.editBoardGroup({
          groupId: args.groupId as string,
          boardId: args.boardId as string,
          name: args.name as string | undefined,
          boardTypeIds: args.boardTypeIds as string[] | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_board_type': {
        if (!args?.name || !args?.boardId) {
          throw new Error('name and boardId are required');
        }
        const result = await vaizClient.createBoardType({
          name: args.name as string,
          boardId: args.boardId as string,
          icon: args.icon as string | undefined,
          color: args.color as string | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'edit_board_type': {
        if (!args?.typeId || !args?.boardId) {
          throw new Error('typeId and boardId are required');
        }
        const result = await vaizClient.editBoardType({
          typeId: args.typeId as string,
          boardId: args.boardId as string,
          name: args.name as string | undefined,
          icon: args.icon as string | undefined,
          color: args.color as string | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_milestones': {
        if (!args?.projectId) {
          throw new Error('projectId is required');
        }
        const result = await vaizClient.getMilestones(args.projectId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_milestone': {
        if (!args?.name || !args?.project || !args?.board) {
          throw new Error('name, project, and board are required');
        }
        const result = await vaizClient.createMilestone({
          name: args.name as string,
          project: args.project as string,
          board: args.board as string,
          dueStart: args.dueStart as string | undefined,
          dueEnd: args.dueEnd as string | undefined,
          description: args.description as string | undefined,
          color: args.color as string | undefined,
          tags: args.tags as string[] | undefined,
        } as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'download_image': {
        if (!args?.imageUrl) {
          throw new Error('imageUrl is required');
        }

        // Create temporary path
        const tempPath: string =
          (args.localPath as string | undefined) || `/tmp/vaiz-image-${Date.now()}.png`;

        try {
          // Download the image
          await vaizClient.downloadImage(args.imageUrl as string, tempPath);

          // Read the image file
          const fs = await import('fs/promises');
          const imageData = await fs.readFile(tempPath);
          const base64Image = imageData.toString('base64');

          // Determine mime type from URL or file extension
          const ext = tempPath.split('.').pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            bmp: 'image/bmp',
          };
          const mimeType = mimeTypes[ext || 'png'] || 'image/png';

          // Clean up the temporary file
          await fs.unlink(tempPath);

          return {
            content: [
              {
                type: 'image',
                data: base64Image,
                mimeType: mimeType,
              },
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: 'Image downloaded and ready for analysis',
                    url: args.imageUrl,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          // Try to clean up temp file on error
          try {
            const fs = await import('fs/promises');
            await fs.unlink(tempPath);
          } catch {
            // Ignore cleanup errors
          }
          throw error;
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vaiz MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
