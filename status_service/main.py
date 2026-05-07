"""FastAPI 应用入口。

初学者说明：
- 这个文件负责创建 FastAPI 应用对象。
- 这个文件也负责声明接口路径、请求方法和处理函数。
- 启动服务器时，uvicorn 会加载这里的 `app` 对象。
"""

# `from __future__ import annotations` 可以让类型注解更灵活。
from __future__ import annotations

# `FastAPI` 用来创建 Web 应用。
# `Response` 用来手动控制 HTTP 响应，比如动态设置状态码。
from fastapi import FastAPI, Response

# 从配置文件导入 `Settings`，这样应用名称、版本号、接口路径都集中管理。
from .config import Settings

# 从入参模型文件导入 `StatusCodeRequest`。
# 它负责描述 POST /status 的 JSON 请求体格式。
from .schemas import HealthResponse, StatusCodeRequest


# 创建配置对象。
# 后面创建 FastAPI 应用、注册接口时都会使用这些配置。
settings = Settings()

# 创建 FastAPI 应用对象。
# `app` 是 FastAPI 项目的核心对象，所有接口都会挂载到它上面。
app = FastAPI(
    # 应用名称会显示在自动接口文档页面中。
    title=settings.app_name,
    # 应用版本也会显示在自动接口文档页面中。
    version=settings.app_version,
    # 应用描述会显示在自动接口文档页面中，帮助别人理解这个服务做什么。
    description="传入一个 HTTP 状态码，接口就返回同样的 HTTP 状态码。",
)


@app.get(
    settings.health_endpoint,
    response_model=HealthResponse,
    summary="健康检查",
    tags=["health"],
)
def health_check() -> HealthResponse:
    """返回服务健康状态。"""

    return HealthResponse()


# `@app.post(...)` 是 FastAPI 的路由装饰器。
# 它表示：当客户端用 POST 方法请求这个路径时，就执行下面的函数。
@app.post(
    settings.status_endpoint,
    # `summary` 是接口文档中的简短说明。
    summary="返回指定 HTTP 状态码",
    # `tags` 可以把接口在文档里分组。
    tags=["status"],
)
def return_status_code(request_body: StatusCodeRequest) -> Response:
    """根据请求体里的 `type` 字段返回对应 HTTP 状态码。"""

    # 从请求体模型中读取 `type` 字段。
    # 例如客户端传 `{"type": 404}`，这里拿到的就是整数 404。
    status_code = request_body.type

    # 返回一个 FastAPI/Starlette 的 Response 对象。
    # `status_code=status_code` 表示响应状态码由客户端传入的 type 决定。
    # 这里不返回响应体，因为需求只要求“返回什么状态码”。
    return Response(status_code=status_code)
