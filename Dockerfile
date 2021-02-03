FROM mcr.microsoft.com/playwright

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

CMD ["yarn", "serve:screenshot:server:local" ]