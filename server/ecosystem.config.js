module.exports = {
  apps: [
    {
      name: 'real-estate-app',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
      }
    },
  ],
}
