FROM node:14-alpine

ENV OPENAI_KEY=""

WORKDIR /app

COPY package.json ./

RUN npm install --production

COPY . .

EXPOSE 9000

CMD ["npm", "start"]
