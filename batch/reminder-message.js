const AwsBatch = require('./batch-client-config.js');

async function createReminderJob(phoneNumber,templateName) {
    try {
        const jobName = `reminder-message-for-${phoneNumber}`;

        const jobParams = {
            jobName: jobName,
            jobQueue: "next-day-message-job-queue",
            jobDefinition: "next-day-message-definition",
            containerOverrides: {
                command: ["npm","start","reminder:send",`${phoneNumber}`,`${templateName}`]
            },
            // Set a maximum execution time for the job
            timeout: { 
                attemptDurationSeconds: 3600
            },
            // Set the number of times the job will be retried on failure
            attempts: 3,
            // Schedule the job to start at the specified time
        };
    
        const response = await AwsBatch.submitJob(jobParams);
        console.log('Reminder Job created:', response.jobId);
    } catch (error) {
        console.error('Error creating job:', error);
    }
}

module.exports = createReminderJob;
