module.exports = {
  apps: [
    {
      name: 'hrms-backend',
      script: 'src/server.js',
      cwd: '/home/ubuntu/app/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        CLIENT_ORIGIN: 'https://hrms.natsoft.io',
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_USER: 'root',
        DB_NAME: 'hrms_db',
        UPLOAD_DIR: 'uploads',
        MAX_UPLOAD_MB: 10,
      },
    },
  ],
};
