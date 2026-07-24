/**
 * Asynchronous Non-Blocking Notification Queue
 * Handles push notification dispatching in background workers with retry logic.
 * Prevents API controllers from being blocked by external network calls.
 */

import { FCMService } from './fcmService.js';

class NotificationQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
  }

  /**
   * Enqueue a push notification dispatch job
   * @param {Object} job { type: 'MULTICAST'|'USERS'|'ROLE'|'TOPIC', target: Array|String, payload: Object, retryCount: Number }
   */
  enqueue(job) {
    const queueJob = {
      ...job,
      id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date(),
      retryCount: job.retryCount || 0
    };

    this.queue.push(queueJob);
    console.log(`[NotificationQueue] Job ${queueJob.id} enqueued (${queueJob.type}). Queue length: ${this.queue.length}`);
    
    // Process asynchronously without blocking current execution stack
    setImmediate(() => this.processQueue());
  }

  /**
   * Process jobs sequentially in background loop
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();

      try {
        console.log(`[NotificationQueue] Processing job ${job.id}...`);
        let result = null;

        if (job.type === 'MULTICAST') {
          result = await FCMService.sendMulticastPush(job.target, job.payload);
        } else if (job.type === 'USERS') {
          result = await FCMService.sendFCMToUserIds(job.target, job.payload);
        } else if (job.type === 'ROLE') {
          result = await FCMService.sendFCMToRole(job.target, job.payload);
        } else if (job.type === 'TOPIC') {
          result = await FCMService.sendToTopic(job.target, job.payload);
        }

        console.log(`[NotificationQueue] Job ${job.id} completed successfully:`, result);
      } catch (error) {
        console.error(`[NotificationQueue] Error processing job ${job.id}:`, error.message);

        // Handle retry with exponential backoff if below max retries
        if (job.retryCount < this.maxRetries) {
          const nextRetry = job.retryCount + 1;
          const delay = Math.pow(2, nextRetry) * 1000; // 2s, 4s, 8s

          console.log(`[NotificationQueue] Scheduling retry #${nextRetry} for job ${job.id} in ${delay}ms...`);
          setTimeout(() => {
            this.enqueue({
              ...job,
              retryCount: nextRetry
            });
          }, delay);
        } else {
          console.error(`[NotificationQueue] Job ${job.id} failed permanently after ${this.maxRetries} retries.`);
        }
      }
    }

    this.isProcessing = false;
  }
}

export const notificationQueue = new NotificationQueue();
