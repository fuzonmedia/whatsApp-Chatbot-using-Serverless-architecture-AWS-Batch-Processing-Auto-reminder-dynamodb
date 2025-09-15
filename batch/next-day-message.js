const AwsBatch = require('./batch-client-config.js');

async function createJob(phoneNumber,templateName) {
    try {
        const jobName = `next-day-message-for-${phoneNumber}`;
        console.log(`JobName [createJob] >>> ${jobName}`);
        console.log(`Template [createJob] >>> ${templateName}`);
        const jobParams = {
            jobName: jobName,
            jobQueue: "next-day-message-job-queue",
            jobDefinition: "next-day-message-definition",
            containerOverrides: {
                command: ["npm","start","message:send",`${phoneNumber}`,`${templateName}`]
            },
            // Set a maximum execution time for the job
            timeout: { 
                attemptDurationSeconds: 3600
            },
            // Set the number of times the job will be retried on failure
            attempts: 3,
        };
    
        const response = await AwsBatch.submitJob(jobParams);
        console.log('Next Day Message Job created:', response.jobId);
    } catch (error) {
        console.error('Error creating job:', error);
    }
}

module.exports = createJob;
