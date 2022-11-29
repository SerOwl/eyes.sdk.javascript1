import json
import os
import re
import uuid
from copy import copy

import pytest
import requests

from applitools.common.utils.converters import str2bool

REPORT_DATA = {
    "sdk": "python",
    "group": "selenium",
    "id": os.getenv("GITHUB_SHA", str(uuid.uuid4())),
    "sandbox": bool(str2bool(os.getenv("TEST_REPORT_SANDBOX", "True"))),
    "mandatory": False,
    "results": [],
}


def underscore_to_camelcase(text):
    return re.sub(r"(?!^)_([a-zA-Z])", lambda m: m.group(1).upper(), text)


def prepare_result_data(test_name, passed, parameters):
    test_name = underscore_to_camelcase(test_name)
    result = dict(test_name=test_name, passed=passed)
    if parameters:
        result["parameters"] = parameters
    params_index_start = test_name.find("[")
    if params_index_start == -1:
        return result

    result["test_name"] = test_name[:params_index_start]
    return result


def send_result_report(test_name, passed, parameters=None, group="selenium"):
    report_data = copy(REPORT_DATA)
    report_data["results"] = [prepare_result_data(test_name, passed, parameters)]
    report_data["group"] = group
    r = requests.post(
        "http://applitools-quality-server.herokuapp.com/result", data=json.dumps(report_data)
    )
    r.raise_for_status()
    print("Result report send: {} - {}".format(r.status_code, r.text))
    return r


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    result = outcome.get_result()
    if result.when == "setup":
        # skip tests on setup stage and if skipped
        return

    passed = result.outcome == "passed"
    group = "selenium"
    test_name = item.name
    parameters = None

    send_result_report(
        test_name=test_name, passed=passed, parameters=parameters, group=group
    )
