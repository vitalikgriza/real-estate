module.exports = {
  apps: [
    {
      name: 'real-estate-app',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      }
    },
  ],
}
