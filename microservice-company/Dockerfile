FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY ./proto ./proto

EXPOSE 6000
CMD ["node", "index.js"]
