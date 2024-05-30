FROM node:18-alpine

WORKDIR /home/node/app
# 
COPY package*.json /home/node/app/
COPY . /home/node/app/

RUN npm install -g npm@10.8.1

RUN mv src/web ./public

RUN npm install

CMD ["node", "src/oai-pmh-view-server.js"]
