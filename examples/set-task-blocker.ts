import { VaizClient } from 'vaiz-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example: Setting a blocking relationship between tasks
 *
 * This example demonstrates how to use the setTaskBlocker method to create
 * a dependency between two tasks, where one task blocks another.
 */

async function main() {
  // Initialize the Vaiz client
  const client = new VaizClient({
    apiKey: process.env.VAIZ_API_KEY!,
    spaceId: process.env.VAIZ_SPACE_ID!,
    verbose: true, // Enable verbose logging to see API calls
  });

  try {
    // Example 1: Set a blocking relationship
    // Task 'TASK-123' blocks task 'TASK-456'
    console.log('\n=== Setting Task Blocker ===');
    console.log('Setting TASK-123 to block TASK-456...\n');

    const result = await client.setTaskBlocker({
      blockedTaskId: 'TASK-456', // The task that is being blocked
      blockerTaskId: 'TASK-123', // The task that blocks
    });

    console.log('✅ Blocking relationship created successfully!\n');
    console.log('Blocked Task:', {
      id: result.blockedTask.id,
      slug: result.blockedTask.slug,
      name: result.blockedTask.name,
    });
    console.log('\nBlocker Task:', {
      id: result.blockerTask.id,
      slug: result.blockerTask.slug,
      name: result.blockerTask.name,
    });

    // Example 2: You can also use database IDs instead of slugs
    console.log('\n=== Using Database IDs ===');
    const resultWithIds = await client.setTaskBlocker({
      blockedTaskId: result.blockedTask.id,
      blockerTaskId: result.blockerTask.id,
    });
    console.log('✅ Works with database IDs too!\n');

    // Example 3: Setting multiple blockers
    // If you want to add multiple blockers, call setTaskBlocker multiple times
    // or use editTask with the full list of blockers
    console.log('\n=== Setting Multiple Blockers ===');
    await client.setTaskBlocker({
      blockedTaskId: 'TASK-789',
      blockerTaskId: 'TASK-123',
    });
    await client.setTaskBlocker({
      blockedTaskId: 'TASK-789',
      blockerTaskId: 'TASK-456',
    });
    console.log('✅ Task TASK-789 is now blocked by both TASK-123 and TASK-456\n');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
