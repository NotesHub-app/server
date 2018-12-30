FROM node:8-jessie
WORKDIR /usr/src/app
COPY ../package.json ./yarn.lock ./
RUN yarn
COPY .. ./
RUN yarn build

EXPOSE 4000
CMD [ "yarn", "prod" ]


