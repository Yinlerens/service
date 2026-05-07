"""命令行启动文件。

初学者说明：
- FastAPI 本身只负责“定义接口”。
- 真正把接口跑起来、监听端口的是 ASGI 服务器。
- 这里使用常见的 `uvicorn` 作为 ASGI 服务器。
"""

# `from __future__ import annotations` 可以让类型注解更灵活。
from __future__ import annotations

# `argparse` 是 Python 标准库，用来解析命令行参数。
# 例如用户输入 `--host 0.0.0.0 --port 9000`，我们就可以读取到这些值。
import argparse

# 从配置文件中导入 `Settings` 类，避免把端口、地址等配置写死在多个地方。
from .config import Settings


def build_parser() -> argparse.ArgumentParser:
    """创建命令行参数解析器。"""

    # 创建一个解析器对象，并写清楚这个命令是做什么的。
    parser = argparse.ArgumentParser(description="启动 FastAPI HTTP 状态码返回服务。")

    # 添加 `--host` 参数。
    # 如果用户不传，就会使用配置里的默认值。
    parser.add_argument("--host", default=None, help="服务监听地址，例如 127.0.0.1 或 0.0.0.0。")

    # 添加 `--port` 参数。
    # `type=int` 表示这个参数会被转成整数。
    parser.add_argument("--port", default=None, type=int, help="服务监听端口，例如 8000。")

    # 返回配置好的解析器，供 `main` 函数继续使用。
    return parser


def run(host: str | None = None, port: int | None = None) -> None:
    """使用 uvicorn 启动 FastAPI 应用。"""

    # 在函数内部导入 `uvicorn`。
    # 好处是：只查看帮助或导入模块时，不会立刻启动服务器。
    import uvicorn

    # 创建配置对象，读取默认应用名称、端口、地址等信息。
    settings = Settings()

    # 如果调用方传了 host，就使用调用方传入的值；否则使用默认配置。
    bind_host = host or settings.host

    # 如果调用方传了 port，就使用调用方传入的值；否则使用默认配置。
    bind_port = port or settings.port

    # 在控制台打印启动地址，方便初学者知道应该访问哪里。
    print(f"服务启动中：http://{bind_host}:{bind_port}{settings.status_endpoint}")

    # `uvicorn.run` 会启动 ASGI 服务器。
    # `"status_service.main:app"` 的意思是：
    # - 找到 `status_service/main.py`
    # - 读取里面名叫 `app` 的 FastAPI 应用对象
    uvicorn.run("status_service.main:app", host=bind_host, port=bind_port)


def main() -> None:
    """命令行入口函数。"""

    # 创建命令行参数解析器。
    parser = build_parser()

    # 读取用户在命令行里传入的参数。
    args = parser.parse_args()

    # 使用解析出来的地址和端口启动服务。
    run(host=args.host, port=args.port)
