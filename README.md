# koa-influx-galen

influxDB监控系统

## 环境搭建

* 拉取influxDB镜像

```bash
docker pull influxdb:1.7-alpine
docker run -p 8086:8086 --name docker-influxdb -d influxdb:1.7-alpine
```

* 测试启动

```bash
yarn run dev
```

### api文档

PS: query添加isReload条件，强制生成文档，否则，将会缓存60秒

* json

```url
http://127.0.0.1:3000/v1/swagger.json
```

* html

```url
http://127.0.0.1:3000/v1/apidoc
```

### 搜索

例子:

```url
http://127.0.0.1:3000/v1/responseTimes?where={"time":{"$gt":1597745072984}}&order=time desc&limit=2
```

* where
  * equal  where={"host":"127.0.0.1"}
  * gt where={"time":{"$gt":1597745072984}}
  * gte where={"time":{"$gte":1597745072984}}
  * lt where={"time":{"$lt":1597745072984}}
  * lte where={"time":{"$lte":1597745072984}}

* order default order=time desc
  * desc order=time desc
  * asc order=time asc

* limit default 20
  * number 20

## 目前存在的问题

* [x] 未支持虚拟的model类型
* [x] 异步检查database是否存在改为同步逻辑
* [x] 未支持koa中间件注入
* [x] koa安全关闭
