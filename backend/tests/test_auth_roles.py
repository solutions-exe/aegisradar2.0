import asyncio
import unittest

from app.auth import require_role


class RequireRoleTests(unittest.TestCase):
    def test_analyst_role_is_allowed_for_view_access(self):
        role_checker = require_role(["view_transactions"])

        async def run_check():
            current_user = {"email": "analyst@example.com", "role": "Analyst"}
            return await role_checker(current_user=current_user)

        result = asyncio.run(run_check())

        self.assertEqual(result["email"], "analyst@example.com")
        self.assertEqual(result["role"], "Analyst")


if __name__ == "__main__":
    unittest.main()
