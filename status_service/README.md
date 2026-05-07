# FastAPI HTTP 状态码返回服务

这是一个结构简单但目录清晰的 Python 后端服务。

当前只提供一个接口：

```http
POST /status
```

请求体里的 `type` 是 HTTP 状态码，接口会把响应状态码设置成同样的值。

## 目录说明

```text
status_service/
  __init__.py      # 把 status_service 标记为 Python 包
  __main__.py      # 支持 python -m status_service 启动
  config.py        # 集中保存应用配置
  main.py          # 创建 FastAPI app，并声明接口
  schemas.py       # 定义接口请求体模型
  server.py        # 使用 uvicorn 启动服务
tests/
  test_status_endpoint.py  # 接口测试
```

## 安装依赖

```bash
python -m pip install -r requirements.txt
```

## 启动服务

```bash
python -m status_service --host 127.0.0.1 --port 8000
```

启动后可以打开自动接口文档：

```text
http://127.0.0.1:8000/docs
```

## 调用接口

示例：传入 `201`，接口就返回 `HTTP 201`。

```bash
curl -i -X POST http://127.0.0.1:8000/status \
  -H "Content-Type: application/json" \
  -d "{\"type\": 201}"
```

示例：传入 `404`，接口就返回 `HTTP 404`。

```bash
curl -i -X POST http://127.0.0.1:8000/status \
  -H "Content-Type: application/json" \
  -d "{\"type\": 404}"
```

## 测试

```bash
python -m unittest
```

q8iyTxdiCcLR-kQX
