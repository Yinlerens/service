"""保存服务运行时配置。

初学者说明：
- 配置就是“不经常变化，但很多地方会用到”的值。
- 例如：服务名称、版本号、监听地址、监听端口、接口路径。
- 把配置集中放在一个文件里，比散落在各个文件里更容易维护。
"""

# `from __future__ import annotations` 可以让类型注解更灵活。
# 初学阶段可以先理解为：它帮助 Python 更好地处理 `str`、`int` 这类类型提示。
from __future__ import annotations

# `dataclass` 是 Python 标准库提供的工具。
# 它可以帮我们少写很多样板代码，比如 `__init__` 初始化函数。
from dataclasses import dataclass


# `@dataclass` 是一个“装饰器”，它会自动给下面的类增加初始化能力。
# `frozen=True` 表示这个配置对象创建后不建议再修改，避免运行中被误改。
@dataclass(frozen=True)
class Settings:
    """应用配置类。"""

    # FastAPI 文档页和 OpenAPI 元数据中显示的应用名称。
    app_name: str = "HTTP 状态码返回服务"

    # 当前服务版本号。
    app_version: str = "0.1.0"

    # 服务默认监听的主机地址。
    # `127.0.0.1` 表示只允许本机访问，适合本地开发。
    host: str = "127.0.0.1"

    # 服务默认监听端口。
    # 启动后访问地址通常是 `http://127.0.0.1:8000`。
    port: int = 8000

    # 第一个业务接口路径。
    # 也就是说，POST 请求会发到 `/status`。
    status_endpoint: str = "/status"
