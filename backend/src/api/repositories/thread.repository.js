import { connect } from "../utils/connection.js";

export async function saveThreadsConsume(threadsConsume) 
{
  const db = await connect();

  const query = `
    INSERT INTO threadsConsume (timestamp, thread_name, quantity_of_cpu_ind_percentage)
    VALUES (?, ?, ?)
  `;

  await db.run(query, [
    threadsConsume.timestamp,
    threadsConsume.thread_name,
    threadsConsume.quantity_of_cpu_ind_percentage
  ]);
}

export async function getThreadsConsume() 
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, thread_name, quantity_of_cpu_ind_percentage 
    FROM threadsConsume
  `);
}

export async function getThreadsConsumeByThreadName(thread_name) 
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, thread_name, quantity_of_cpu_ind_percentage 
    FROM threadsConsume
    where TRIM(LOWER(thread_name)) = TRIM(LOWER(?))
  `, [thread_name])
}

export async function getThreadsConsumeByTimeStamp(timestamp) 
{
  const db = await connect();

  return await db.all(`
    SELECT timestamp, thread_name, quantity_of_cpu_ind_percentage 
    FROM threadsConsume
    where timestamp >= ?
  `, [timestamp])
}