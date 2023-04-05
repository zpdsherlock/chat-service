# chat-service

# OpenAI-VPS
## OpenAI 流量代理服务部署
``` shell
$ git clone -b shadowsocks-android https://github.com/zpdsherlock/go-gost.git
$ docker build -t zpdsherlock/gost .
$ docker run -d --rm --name openai -p 9222:9222 zpdsherlock/gost -L "relay+tls://chacha20-ietf-poly1305:g8ysjOp0pU9KUYvYP%2Fjw6K@:9222"
```

# Service-VPS
## Docker 网络配置
``` shell
$ docker network create gost
```
## 服务镜像部署
### OpenAI 流量转发服务部署
``` shell
$ git clone -b shadowsocks-android https://github.com/zpdsherlock/go-gost.git
$ docker build -t zpdsherlock/gost .
$ docker run -d --rm --name gost --net gost -p 1080:1080 zpdsherlock/gost -L "auto://:1080" -F "relay+tls://chacha20-ietf-poly1305:g8ysjOp0pU9KUYvYP%2Fjw6K@${OVERSEA_VPS_IP}:9222"
```

## 站点服务部署
### mongoDB
``` shell
$ docker pull mongo:latest
$ docker run -d --name mongodb --net gost -p 27017:27017 mongo
```
### 站点服务部署
``` shell
$ cd service
$ docker build -t chat/service .
$ docker run -d --rm --name service --net gost -p 9000:9000 -e OPENAI_KEY=${YOUR_OPENAI_KEY} chat/service
```
