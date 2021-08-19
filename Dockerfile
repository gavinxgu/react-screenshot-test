FROM mcr.microsoft.com/playwright:v1.14.0-bionic
RUN apt-get -qqy update && \
  apt-get -qqy --no-install-recommends install \
  fonts-roboto \
  fonts-noto-cjk \
  fonts-ipafont-gothic \
  fonts-wqy-zenhei \
  fonts-kacst \
  fonts-freefont-ttf \
  fonts-thai-tlwg \
  fonts-indic && \
  apt-get -qyy clean
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --ignore-scripts
COPY . .
RUN yarn build

CMD ["yarn", "serve:screenshot:server:local" ]