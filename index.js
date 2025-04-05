/** @format */

require('dotenv').config();
const { handler } = require('./src/handler.js');
// const { validateEnvironmentData } = require('./src/env/env.js');

// validateEnvironmentData();
console.log('Starting Lambda function... wow!');

module.exports = { handler };

// handler();

// $env:DOCKER_BUILDKIT=0  
// docker build --no-cache -t habilnk/backup-nimbus .
// docker tag habilnk/backup-nimbus:latest 767828744098.dkr.ecr.ap-south-1.amazonaws.com/habilnk/backup-nimbus
// docker push 767828744098.dkr.ecr.ap-south-1.amazonaws.com/habilnk/backup-nimbus

