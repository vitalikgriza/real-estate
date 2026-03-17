module.exports = {
  apps: [
    {
      name: 'rentiful-app',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      }
    },
  ],
}
