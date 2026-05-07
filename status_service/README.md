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
uv sync
```

如果需要运行测试，再安装测试依赖：

```bash
uv sync --extra test
```

## 启动服务

```bash
uv run status-service --host 127.0.0.1 --port 8000
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
uv run --extra test python -m unittest
```

## 镜像发布

代码推送到 GitHub 后，GitHub Actions 会自动构建镜像并推送到 GitHub Container Registry：

```text
ghcr.io/<owner>/<repo>
```

默认分支会额外发布 `latest` 标签；分支、Git tag 和提交 SHA 也会生成对应镜像标签。

## Kubernetes / ArgoCD 部署

当前部署配置默认使用：

- 命名空间：`status-service`
- 镜像：`ghcr.io/yinlerens/service:latest`
- ArgoCD Application 所在命名空间：`argocd`
- Git 仓库：`https://github.com/Yinlerens/service.git`
- Git 分支：`main`
- 暴露方式：Kubernetes `Ingress`

首次接入 ArgoCD 时，在集群中应用：

```bash
kubectl apply -f argocd/app.yaml
```

如果你的集群需要指定域名、TLS 或 `ingressClassName`，请调整 `k8s/route.yaml`。
