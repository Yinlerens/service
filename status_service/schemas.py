"""接口入参模型。

初学者说明：
- FastAPI 通常配合 Pydantic 来描述请求参数。
- “模型”就是一个类，用来声明客户端应该传什么字段、字段是什么类型。
- FastAPI 会根据这个模型自动做参数校验，也会自动生成接口文档。
"""

# `from __future__ import annotations` 可以让类型注解更灵活。
from __future__ import annotations

# `BaseModel` 是 Pydantic 的基础模型类。
# 继承它之后，我们就可以声明一个请求体应该有哪些字段。
from pydantic import BaseModel, Field


class StatusCodeRequest(BaseModel):
    """POST /status 接口的请求体。"""

    # 这里的字段名必须叫 `type`，因为用户要求参数名就是 `type`。
    # 注意：Python 里也有一个内置函数叫 `type`。
    # 在真实大型项目里，为了避免混淆，可能会用别名方案。
    # 但这个接口需求明确要求字段名是 `type`，所以这里直接使用它。
    type: int = Field(
        ...,
        # `ge` 是 greater than or equal 的缩写，表示“大于等于”。
        # HTTP 状态码最小通常从 100 开始。
        ge=100,
        # `le` 是 less than or equal 的缩写，表示“小于等于”。
        # HTTP 状态码最大通常到 599。
        le=599,
        # `description` 会出现在 FastAPI 自动生成的接口文档里。
        description="要返回的 HTTP 状态码，例如 200、201、404、500。",
        # `examples` 也会出现在接口文档里，方便调用者理解怎么传参。
        examples=[200],
    )


class HealthResponse(BaseModel):
    """GET /health 接口的响应体。"""

    # `status=ok` 表示应用进程已经可以正常响应请求。
    status: str = Field(
        default="ok",
        description="服务健康状态。",
        examples=["ok"],
    )
