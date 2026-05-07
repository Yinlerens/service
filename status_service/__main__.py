"""让服务支持 `python -m status_service` 这种启动方式。

初学者说明：
- `python -m 包名` 会寻找这个包里的 `__main__.py` 文件并执行。
- 所以我们把真正的启动逻辑放在 `server.py`，这里仅负责调用它。
"""

# 从当前包的 `server.py` 文件中导入 `main` 函数。
# 前面的点 `.` 表示“当前包”，也就是 `status_service`。
from .server import main


# 这是一段 Python 常见写法。
# 当这个文件被直接运行时，`__name__` 的值会是 `"__main__"`。
# 当这个文件被别人 import 时，下面的代码不会自动执行。
if __name__ == "__main__":
    # 调用命令行入口函数，开始解析参数并启动服务。
    main()
