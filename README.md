# BackupNimbus

BackupNimbus is a fully automated, AWS-native backup system designed to protect and preserve your MongoDB Atlas data with zero human intervention. Built with Node.js, AWS Lambda, Docker, and EventBridge, this serverless solution performs daily encrypted backups using `mongodump`, stores them in Amazon S3, and secures credentials via AWS Systems Manager (SSM) — all without relying on external cron jobs or third-party infrastructure.

![BackupNimbus Logo](https://via.placeholder.com/800x200?text=BackupNimbus)

## Features

- **Fully Automated**: Scheduled backups with AWS EventBridge  
- **Secure**: Base64 encoded environment variables for sensitive data  
- **Flexible**: Pluggable architecture using SOLID principles  
- **Reliable**: Error handling, retries, and detailed logging  
- **Scalable**: Serverless design with AWS Lambda  
- **Containerized**: Docker support for easy deployment  
- **Configurable**: Exclude specific collections and customize backup parameters  

## Architecture

BackupNimbus follows clean architecture principles with a focus on modularity and testability:

```
BackupNimbus/
├── src/
│   ├── backup/                 # Backup domain
│   │   ├── providers/          # Different backup implementations
│   │   └── backup-service.js   # Main backup orchestration
│   ├── storage/                # Storage domain
│   │   └── providers/          # Different storage implementations
│   ├── config/                 # Configuration handling
│   │   └── providers/          # Configuration source implementations
│   ├── utils/                  # Shared utilities
│   └── handler.js              # Main application entry point
```

### Key Components

- **Backup Providers**: Abstract backup creation (MongoDB implementation)  
- **Storage Providers**: Abstract backup storage (S3 implementation)  
- **Config Providers**: Abstract configuration retrieval (Environment implementation)  
- **Utilities**: Shared functionality (logging, command execution)  

## Installation

### Prerequisites

- Node.js 18+  
- MongoDB database tools (`mongodump`)  
- AWS account with S3 bucket  

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/BackupNimbus.git
cd BackupNimbus

# Install dependencies
npm install

# Create .env file with your credentials (base64 encoded)
cp .env.example .env
# Edit .env file with your credentials

# Run locally
npm run start:dev
```

### Docker Deployment

```bash
# Build Docker image
docker build -t backupnimbus .

# Run container
docker run --env-file .env backupnimbus
```

### AWS Lambda Deployment

```bash
# Build and push to ECR
docker build -t backupnimbus .
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
docker tag backupnimbus:latest your-account-id.dkr.ecr.your-region.amazonaws.com/backupnimbus:latest
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/backupnimbus:latest

# Create Lambda function using the ECR image
# Set up EventBridge rule for scheduling
```

## Configuration

BackupNimbus uses the following environment variables:

| Variable               | Description                              | Required | Format          |
|------------------------|------------------------------------------|----------|-----------------|
| `AWS_ACCESS_KEY_ID`    | AWS access key ID                       | Yes      | Base64 encoded  |
| `AWS_SECRET_ACCESS_KEY`| AWS secret access key                   | Yes      | Base64 encoded  |
| `AWS_REGION`           | AWS region                              | Yes      | Base64 encoded  |
| `AWS_S3_BUCKET_NAME`   | S3 bucket name for storing backups      | Yes      | Base64 encoded  |
| `MONGO_URI`            | MongoDB connection string               | Yes      | Base64 encoded  |
| `DEBUG`                | Enable debug logging                    | No       | Any value       |

## Usage

### Basic Usage

Once deployed, BackupNimbus will automatically create backups according to the configured schedule.

### Customizing Backups

You can customize the backup process by modifying the configuration in `handler.js`:

```javascript
const backupProvider = new MongoDBBackupProvider({
    timeout: 840000,              // Timeout in milliseconds
    excludeCollections: ['zipcodes']  // Collections to exclude
});
```

### Manual Triggering

You can manually trigger a backup by invoking the Lambda function:

```bash
aws lambda invoke --function-name BackupNimbus output.json
```

## Extensibility

BackupNimbus is designed to be extensible. You can:

- Add new backup providers (e.g., PostgreSQL, MySQL)  
- Add new storage providers (e.g., Azure Blob Storage, Google Cloud Storage)  
- Add new configuration providers (e.g., AWS SSM Parameter Store)  

## Logging

The application uses a centralized logger that formats all logs consistently:

```
[INFO] Starting backup with MongoDBBackupProvider
[INFO] Uploading backup file to storage
[INFO] Backup completed successfully
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository  
2. Create your feature branch (`git checkout -b feature/amazing-feature`)  
3. Commit your changes (`git commit -am 'Add some amazing feature'`)  
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request  

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Author

Amalu Sajeev

## Acknowledgments

- MongoDB Atlas for providing a reliable database service  
- AWS for their serverless infrastructure  
- Node.js community for all the amazing tools and libraries  