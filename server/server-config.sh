#!/usr/bin/bash

# Server Configuration Script

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

./.nvm/nvm.sh
nvm install node 23

sudo yum update -y

# Install git
sudo yum install git -y

git clone https://github.com/vitalikgriza/real-estate.git

cd real-estate/server || exit

npm install

echo "PORT=80" > .env
