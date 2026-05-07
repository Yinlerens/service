"""POST /status 接口测试。

初学者说明：
- 测试代码的作用是自动验证接口行为是否符合预期。
- 以后改代码时，只要重新运行测试，就能快速知道有没有把功能改坏。
"""

# `from __future__ import annotations` 可以让类型注解更灵活。
from __future__ import annotations

# `unittest` 是 Python 标准库自带的测试框架。
# 它不需要额外安装，适合做最小项目的自动化测试。
import unittest

# `TestClient` 是 FastAPI 提供的测试客户端。
# 它可以不用真正启动端口，也能像发 HTTP 请求一样测试接口。
from fastapi.testclient import TestClient

# 从 FastAPI 应用入口导入 `app`。
# 测试客户端会把请求直接发送给这个应用对象。
from status_service.main import app


class StatusEndpointTests(unittest.TestCase):
    """POST /status 接口测试类。"""

    # `setUp` 会在每一个测试方法执行前自动运行。
    # 这里创建测试客户端，避免每个测试里重复写创建逻辑。
    def setUp(self) -> None:
        # 创建 FastAPI 测试客户端。
        self.client = TestClient(app)

    def test_health_endpoint_returns_ok(self) -> None:
        """健康检查接口应该返回 HTTP 200 和 ok 状态。"""

        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_returns_requested_success_status_code(self) -> None:
        """传入 201 时，接口应该返回 HTTP 201。"""

        # 发送 POST 请求，请求体中传入 `type=201`。
        response = self.client.post("/status", json={"type": 201})

        # 验证响应状态码确实是 201。
        self.assertEqual(response.status_code, 201)

        # 这个接口只要求返回状态码，所以响应体应该为空。
        self.assertEqual(response.content, b"")

    def test_returns_requested_error_status_code(self) -> None:
        """传入 404 时，接口应该返回 HTTP 404。"""

        # 发送 POST 请求，请求体中传入 `type=404`。
        response = self.client.post("/status", json={"type": 404})

        # 验证响应状态码确实是 404。
        self.assertEqual(response.status_code, 404)

        # 即使是 404，也是我们业务逻辑主动返回的状态码，所以响应体仍然为空。
        self.assertEqual(response.content, b"")

    def test_rejects_out_of_range_status_code(self) -> None:
        """传入 700 时，FastAPI/Pydantic 应该判定参数不合法。"""

        # HTTP 标准状态码范围是 100 到 599，所以 700 不合法。
        response = self.client.post("/status", json={"type": 700})

        # FastAPI 参数校验失败时，默认返回 422 Unprocessable Entity。
        self.assertEqual(response.status_code, 422)

    def test_rejects_missing_type_parameter(self) -> None:
        """没有传 type 字段时，FastAPI/Pydantic 应该判定参数不合法。"""

        # 发送空 JSON，没有提供必填字段 `type`。
        response = self.client.post("/status", json={})

        # 缺少必填字段时，FastAPI 默认返回 422。
        self.assertEqual(response.status_code, 422)


# 这是一段 Python 常见写法。
# 当我们直接运行 `python tests/test_status_endpoint.py` 时，会执行下面的测试入口。
# 当测试框架自动发现这个文件时，下面这段不会重复干扰测试发现流程。
if __name__ == "__main__":
    # 启动 unittest 测试运行器。
    unittest.main()
