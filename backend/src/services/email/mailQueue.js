'use strict';






const cfg = require('../../config/env');

let Queue, Worker, IORedis;
try {
  ({ Queue, Worker } = require('bullmq'));
  IORedis = require('ioredis');
} catch {

}

const QUEUE_NAME = 'hrms-email-queue';

let _connection = null;
let _queue = null;
let _queueReady = false;





function getConnection() {
  if (_connection) return _connection;
  if (!IORedis) return null;

  const { host, port, password } = cfg.redis;
  if (!host) return null;

  _connection = new IORedis({
    host,
    port,
    password: password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true
  });

  _connection.on('error', (err) => {

    console.warn('[MailQueue] Redis error (emails will fall back to direct send):', err.message);
  });

  return _connection;
}




function getQueue() {
  if (_queue) return _queue;
  const conn = getConnection();
  if (!conn || !Queue) return null;

  _queue = new Queue(QUEUE_NAME, {
    connection: conn,
    defaultJobOptions: {
      attempts: cfg.queue.maxRetries || 3,
      backoff: { type: 'exponential', delay: cfg.queue.retryDelayMs || 5000 },
      removeOnComplete: { age: 7 * 24 * 3600 },
      removeOnFail: { age: 30 * 24 * 3600 }
    }
  });

  _queue.on('error', (err) => {
    console.warn('[MailQueue] Queue error:', err.message);
  });

  _queueReady = true;
  return _queue;
}






async function enqueue(jobData) {
  const q = getQueue();
  if (!q) return null;

  const priorityMap = { critical: 1, high: 2, medium: 5, low: 10, bulk: 20 };
  const priority = priorityMap[jobData.priority] || 5;

  try {
    const job = await q.add('send-email', jobData, { priority });
    return job.id;
  } catch (err) {
    console.warn('[MailQueue] Failed to enqueue job, will try direct send:', err.message);
    return null;
  }
}





function createWorker(processorFn) {
  const conn = getConnection();
  if (!conn || !Worker) {
    console.info('[MailQueue] BullMQ Worker not started — Redis not available');
    return null;
  }

  const worker = new Worker(QUEUE_NAME, processorFn, {
    connection: conn,
    concurrency: cfg.queue.concurrency || 5
  });

  worker.on('completed', (job) => {
    console.info(`[MailQueue] Job completed: id=${job.id} to=${job.data.to} tpl=${job.data.template}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[MailQueue] Job failed: id=${job?.id} to=${job?.data?.to} err=${err.message}`);
  });

  worker.on('error', (err) => {
    console.warn('[MailQueue] Worker error:', err.message);
  });

  console.info('[MailQueue] BullMQ Worker started');
  return worker;
}

module.exports = { enqueue, createWorker, getQueue, getConnection, QUEUE_NAME };
