import pytest

from app.main import app


ZERO = "00000000-0000-0000-0000-000000000000"


# Every documented operation gets a low-cost HTTP smoke contract. Business-critical
# success paths and authorization boundaries are covered by the workflow test modules.
CASES = [
    ("GET", "/health", None, {200}),
    ("GET", "/ready", None, {200}),
    ("POST", "/auth/register", {}, {422}),
    ("POST", "/auth/login", {}, {422}),
    ("POST", "/auth/change-password", {}, {401}),
    ("POST", f"/api/jobs/{ZERO}/applications", {}, {401}),
    ("GET", f"/api/jobs/{ZERO}/applications", None, {401}),
    ("GET", f"/api/jobs/{ZERO}/applications/review", None, {401}),
    ("GET", f"/api/applications/{ZERO}/resume", None, {401}),
    ("GET", "/api/applications/me", None, {401}),
    ("PATCH", f"/api/applications/{ZERO}/status", {}, {401}),
    ("POST", f"/api/applications/{ZERO}/withdraw", None, {401}),
    ("GET", f"/api/{ZERO}/history", None, {401}),
    ("POST", f"/api/{ZERO}/select", None, {401}),
    ("POST", f"/api/{ZERO}/reject", {}, {401}),
    ("POST", f"/api/companies/{ZERO}/jobs", {}, {401}),
    ("POST", "/api/jobs", {}, {401}),
    ("GET", "/api/jobs", None, {200}),
    ("GET", "/api/jobs/me", None, {401}),
    ("GET", f"/api/jobs/{ZERO}", None, {404}),
    ("GET", f"/api/jobs/{ZERO}/ats-score", None, {401}),
    ("PATCH", f"/api/jobs/{ZERO}", {}, {401}),
    ("DELETE", f"/api/jobs/{ZERO}", None, {401}),
    ("POST", f"/api/jobs/{ZERO}/publish", None, {401}),
    ("POST", f"/api/jobs/{ZERO}/close", None, {401}),
    ("GET", "/candidates/me", None, {401}),
    ("POST", "/candidates/me", {}, {401}),
    ("PATCH", "/candidates/me", {}, {401}),
    ("POST", "/companies/", {}, {401}),
    ("GET", "/companies/", None, {200}),
    ("GET", "/companies/me", None, {401}),
    ("GET", f"/companies/{ZERO}", None, {404}),
    ("PATCH", f"/companies/{ZERO}", {}, {401}),
    ("DELETE", f"/companies/{ZERO}", None, {401}),
    ("POST", f"/companies/{ZERO}/members", {}, {401}),
    ("GET", f"/companies/{ZERO}/members", None, {401}),
    ("PATCH", f"/companies/member/{ZERO}/", {}, {401}),
    ("DELETE", f"/companies/member/{ZERO}", None, {401}),
    ("GET", "/resumes/me", None, {401}),
    ("GET", f"/resumes/{ZERO}", None, {401}),
    ("DELETE", f"/resumes/{ZERO}", None, {401}),
    ("GET", f"/resumes/{ZERO}/download", None, {401}),
    ("POST", "/resumes", None, {401, 422}),
    ("PATCH", f"/resumes/{ZERO}/default", None, {401}),
    ("GET", "/api/saved-jobs/", None, {401}),
    ("POST", f"/api/saved-jobs/{ZERO}", None, {401}),
    ("DELETE", f"/api/saved-jobs/{ZERO}", None, {401}),
    ("GET", "/users/me", None, {401}),
    ("GET", "/users/hr-test", None, {401}),
    ("POST", f"/interviews/applications/{ZERO}", {}, {401}),
    ("GET", f"/interviews/applications/{ZERO}", None, {401}),
    ("GET", f"/interviews/{ZERO}", None, {401}),
    ("PATCH", f"/interviews/{ZERO}", {}, {401}),
    ("POST", f"/interviews/{ZERO}/cancel", None, {401}),
    ("POST", f"/interviews/{ZERO}/complete", None, {401}),
    ("POST", f"/interviews/{ZERO}/no-show", None, {401}),
    ("POST", f"/interviews/{ZERO}/feedback", {}, {401}),
    ("GET", f"/interviews/{ZERO}/feedback", None, {401}),
]


def _documented_operations():
    operations = set()
    for path, methods in app.openapi()["paths"].items():
        for method in methods:
            operations.add((method.upper(), path))
    return operations


def _case_operations():
    normalized = set()
    for method, path, _, _ in CASES:
        normalized_path = path.replace(ZERO, "{id}")
        normalized.add((method, normalized_path))
    return normalized


def test_contract_matrix_covers_every_documented_operation():
    documented = {
        (method, path.replace("{job_id}", "{id}").replace("{application_id}", "{id}").replace("{company_id}", "{id}").replace("{member_id}", "{id}").replace("{resume_id}", "{id}").replace("{interview_id}", "{id}"))
        for method, path in _documented_operations()
    }
    assert _case_operations() == documented


@pytest.mark.parametrize("method,path,json_body,expected", CASES)
def test_every_documented_operation_has_a_safe_smoke_response(
    client, method, path, json_body, expected
):
    response = client.request(method, path, json=json_body)
    assert response.status_code in expected, response.text
    assert response.status_code < 500
