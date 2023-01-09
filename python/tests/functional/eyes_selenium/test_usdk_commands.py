from __future__ import unicode_literals

from os import getcwd

from mock import ANY
from pytest import raises

from applitools.common.errors import USDKFailure
from applitools.common.selenium import Configuration
from applitools.selenium.command_executor import CommandExecutor, ManagerType
from applitools.selenium.connection import USDKConnection
from applitools.selenium.fluent import SeleniumCheckSettings


def test_usdk_commands_make_manager():
    commands = CommandExecutor(USDKConnection.create())
    commands.make_core("sdk_name", "sdk_version", getcwd())

    mgr = commands.core_make_manager(ManagerType.CLASSIC)

    assert "applitools-ref-id" in mgr


def test_usdk_commands_open_eyes(local_chrome_driver):
    configuration = Configuration().set_app_name("a").set_test_name("b")
    local_chrome_driver.get("https://demo.applitools.com")
    commands = CommandExecutor(USDKConnection.create())

    commands.make_core("sdk_name", "sdk_version", getcwd())

    mgr = commands.core_make_manager(ManagerType.CLASSIC)

    eyes = commands.manager_open_eyes(mgr, local_chrome_driver, config=configuration)

    assert "applitools-ref-id" in eyes


def test_usdk_commands_set_get_viewport_size(local_chrome_driver):
    commands = CommandExecutor(USDKConnection.create())
    commands.make_core("sdk_name", "sdk_version", getcwd())

    commands.core_set_viewport_size(local_chrome_driver, {"width": 800, "height": 600})
    returned_size = commands.core_get_viewport_size(local_chrome_driver)

    assert returned_size == {"width": 800, "height": 600}


def test_usdk_commands_open_close_eyes(local_chrome_driver):
    config = (
        Configuration()
        .set_app_name("USDK Test")
        .set_test_name("USDK Commands open close")
        .set_user_test_id("42")
    )
    commands = CommandExecutor(USDKConnection.create())
    commands.make_core("sdk_name", "sdk_version", getcwd())
    mgr = commands.core_make_manager(ManagerType.CLASSIC)
    eyes = commands.manager_open_eyes(mgr, local_chrome_driver, config=config)

    assert "applitools-ref-id" in mgr

    eyes_close_result = commands.eyes_close_eyes(eyes, False, Configuration(), True)
    test_result = eyes_close_result[0]

    assert len(eyes_close_result) == 1
    assert test_result["appName"] == "USDK Test"
    assert test_result["name"] == "USDK Commands open close"

    manager_close_result = commands.manager_close_manager(mgr, False, 100)

    assert manager_close_result == {
        "exceptions": 0,
        "failed": 0,
        "matches": 0,
        "mismatches": 0,
        "missing": 0,
        "passed": 1,
        "unresolved": 0,
        "results": [{"result": test_result, "userTestId": "42"}],
    }


def test_usdk_commands_open_abort_eyes(local_chrome_driver):
    config = (
        Configuration()
        .set_app_name("USDK Test")
        .set_test_name("USDK Commands open abort")
        .set_user_test_id("abc")
    )
    commands = CommandExecutor(USDKConnection.create())
    commands.make_core("sdk_name", "sdk_version", getcwd())
    mgr = commands.core_make_manager(ManagerType.CLASSIC)
    eyes = commands.manager_open_eyes(mgr, local_chrome_driver, config=config)

    assert "applitools-ref-id" in mgr

    eyes_abort_result = commands.eyes_abort_eyes(eyes, True)
    test_result = eyes_abort_result[0]

    assert len(eyes_abort_result) == 1
    assert test_result["appName"] == "USDK Test"
    assert test_result["name"] == "USDK Commands open abort"

    manager_close_result = commands.manager_close_manager(mgr, False, 100)

    assert manager_close_result == {
        "exceptions": 1,
        "failed": 1,
        "matches": 0,
        "mismatches": 0,
        "missing": 0,
        "passed": 0,
        "unresolved": 0,
        "results": [
            {
                "result": test_result,
                "error": {
                    "message": "Test 'USDK Commands open abort' of 'USDK Test' is failed! "
                    "See details at undefined",
                    "reason": "test failed",
                    "stack": ANY,
                    "info": ANY,
                },
                "userTestId": "abc",
            }
        ],
    }


def test_usdk_commands_open_check_close_eyes(local_chrome_driver):
    local_chrome_driver.get(
        "https://applitools.github.io/demo/TestPages/SimpleTestPage"
    )
    config = (
        Configuration()
        .set_app_name("USDK Test")
        .set_test_name("USDK Commands open check close")
        .set_user_test_id("abc")
    )

    commands = CommandExecutor(USDKConnection.create())
    commands.make_core("sdk_name", "sdk_version", getcwd())
    mgr = commands.core_make_manager(ManagerType.CLASSIC)
    eyes = commands.manager_open_eyes(mgr, local_chrome_driver, config=config)

    check_result = commands.eyes_check(
        eyes, local_chrome_driver, SeleniumCheckSettings(), config
    )

    eyes_close_result = commands.eyes_close_eyes(eyes, False, Configuration(), True)
    test_result = eyes_close_result[0]

    assert "applitools-ref-id" in mgr
    assert check_result == [{"asExpected": True, "userTestId": "abc"}]
    assert len(eyes_close_result) == 1
    assert test_result["appName"] == "USDK Test"
    assert test_result["name"] == "USDK Commands open check close"

    manager_close_result = commands.manager_close_manager(mgr, True, 100)

    assert manager_close_result == {
        "exceptions": 0,
        "failed": 0,
        "matches": 1,
        "mismatches": 0,
        "missing": 0,
        "passed": 1,
        "unresolved": 0,
        "results": [{"result": test_result, "userTestId": "abc"}],
    }


def test_usdk_commands_error_logging(caplog):
    commands = CommandExecutor.get_instance("sdk_name", "sdk_version")

    with raises(USDKFailure):
        commands.manager_open_eyes({})

    assert "Re-raising an error received from SDK server: USDKFailure" in caplog.text
