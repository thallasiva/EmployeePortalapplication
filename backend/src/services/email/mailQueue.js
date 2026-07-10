'use strict';

/**
 * BullMQ email queue + Redis connection.
 * Gracefully disabled if Redis is not configured / reachable.
 */

const cfg = require('../../config/env');

let Queue, Worker, IORedis;
try {
  ({ Queue, Worker } = require('bullmq'));
  IORedis = require('ioredis');
} catch {
  // packages not available — queue will be disabled
}

const QUEUE_NAME = 'hrms-email-queue';

let _connection = null;
let _queue      = null;
let _queueReady = false;

/**
 * Creates (and caches) the Redis connection.
 * Returns null if Redis env vars are missing or packages not installed.
 */
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
    enableReadyCheck:     false,
    lazyConnect:          true,
  });

  _connection.on('error', (err) => {
    // Log but never crash the process
    console.warn('[MailQueue] Redis error (emails will fall back to direct send):', err.message);
  });

  return _connection;
}

/**
 * Returns the BullMQ Queue instance, or null if not available.
 */
function getQueue() {
  if (_queue) return _queue;
  const conn = getConnection();
  if (!conn || !Queue) return null;

  _queue = new Queue(QUEUE_NAME, {
    connection: conn,
    defaultJobOptions: {
      attempts:        cfg.queue.maxRetries || 3,
      backoff:         { type: 'exponential', delay: cfg.queue.retryDelayMs || 5000 },
      removeOnComplete: { age: 7 * 24 * 3600 },  // keep 7 days
      removeOnFail:     { age: 30 * 24 * 3600 }, // keep 30 days
    },
  });

  _queue.on('error', (err) => {
    console.warn('[MailQueue] Queue error:', err.message);
  });

  _queueReady = true;
  return _queue;
}

/**
 * Adds an email job to the queue.
 * Priority: critical=1, high=2, medium=5, low=10, bulk=20
 * Returns the job id, or null if queue is unavailable.
 */
async function enqueue(jobData) {
  const q = getQueue();
  if (!q) return null;

  const priorityMap = { critical: 1, high: 2, medium: 5, low: 10, bulk: 20 };
  const priority    = priorityMap[jobData.priority] || 5;

  try {
    const job = await q.add('send-email', jobData, { priority });
    return job.id;
  } catch (err) {
    console.warn('[MailQueue] Failed to enqueue job, will try direct send:', err.message);
    return null;
  }
}

/**
 * Creates a BullMQ Worker that processes queued email jobs.
 * Call this once at server startup.
 */
function createWorker(processorFn) {
  const conn = getConnection();
  if (!conn || !Worker) {
    console.info('[MailQueue] BullMQ Worker not started — Redis not available');
    return null;
  }

  const worker = new Worker(QUEUE_NAME, processorFn, {
    connection:  conn,
    concurrency: cfg.queue.concurrency || 5,
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
