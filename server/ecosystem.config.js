module.exports = {
  apps: [
    {
      name: 'rentis-app',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      }
    },
  ],
}
