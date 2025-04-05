import 'dotenv/config';
import { handler } from './src/handler.js';
import logger from './src/utils/logger.js';

// For local execution
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.info('Starting BackupNimbus locally...');
  handler()
    .then(result => logger.info('Execution result:', result))
    .catch(err => logger.error('Execution failed:', err));
}

export { handler };

// Docker build commands (commented out for reference):
// $env:DOCKER_BUILDKIT=0  
// docker build --no-cache -t habilnk/backup-nimbus .
// docker tag habilnk/backup-nimbus:latest 767828744098.dkr.ecr.ap-south-1.amazonaws.com/habilnk/backup-nimbus
// docker push 767828744098.dkr.ecr.ap-south-1.amazonaws.com/habilnk/backup-nimbus

