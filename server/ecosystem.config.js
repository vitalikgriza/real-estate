module.exports = {
  apps: [
    {
      name: 'renti-app',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      }
    },
  ],
}
