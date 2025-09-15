# WhatsApp Chatbot using Serverless AWS

A simple **WhatsApp Chatbot** built on a **serverless AWS architecture** with **DynamoDB**, **batch processing**, and **auto-reminders**. Designed for scalable, cost-efficient customer engagement and notifications.

---

## 📺 Video Explanation
[Watch on YouTube](https://www.youtube.com/watch?v=ckIy3TJm2VE)  

---

## 🚀 Features
- Serverless deployment (AWS Lambda + API Gateway).  
- DynamoDB for storing chat history and reminders.  
- Batch processing with SQS/SNS or AWS Batch.  
- Auto-reminders using CloudWatch/EventBridge.  

---

## 🏗️ Architecture
WhatsApp → WhatsApp Business API → API Gateway → Lambda → DynamoDB
↘ SQS/SNS → Batch Processor → Reminders
