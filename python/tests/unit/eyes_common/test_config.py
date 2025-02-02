import os

import pytest
from mock import patch

from applitools.common import (
    BatchInfo,
    Configuration,
    FailureReports,
    MatchLevel,
    ProxySettings,
    Region,
    SessionType,
    StitchMode,
)
from applitools.common.selenium import Configuration as SeleniumConfiguration
from applitools.common.ultrafastgrid import (
    BrowserType,
    ChromeEmulationInfo,
    DesktopBrowserInfo,
    DeviceName,
    IosDeviceInfo,
    IosDeviceName,
    ScreenOrientation,
    VisualGridOption,
)


def test_config_envs():
    with patch.dict(
        os.environ,
        {
            "APPLITOOLS_BRANCH": "name",
            "APPLITOOLS_PARENT_BRANCH": "parent branch",
            "APPLITOOLS_BASELINE_BRANCH": "baseline branch",
            "APPLITOOLS_API_KEY": "api key",
            "APPLITOOLS_SERVER_URL": "server url",
        },
    ):
        config = Configuration()
    assert config.branch_name == "name"
    assert config.parent_branch_name == "parent branch"
    assert config.baseline_branch_name == "baseline branch"
    assert config.api_key == "api key"
    assert config.server_url == "server url"


@pytest.mark.parametrize("conf", [Configuration(), SeleniumConfiguration()])
def test_set_value_to_conf(conf):
    batch = BatchInfo()
    (
        conf.set_batch(batch)
        .set_branch_name("branch name")
        .set_agent_id("agent id")
        .set_parent_branch_name("parent branch name")
        .set_baseline_branch_name("baseline branch name")
        .set_baseline_env_name("baseline env name")
        .set_environment_name("env name")
        .set_save_diffs(True)
        .set_app_name("app name")
        .set_test_name("test name")
        .set_viewport_size({"width": 400, "height": 300})
        .set_session_type(SessionType.PROGRESSION)
        .set_ignore_caret(False)
        .set_host_app("host app")
        .set_host_os("host os")
        .set_match_timeout(100000)
        .set_match_level(MatchLevel.EXACT)
        .set_ignore_displacements(True)
        .set_save_new_tests(False)
        .set_save_failed_tests(True)
        .set_failure_reports(FailureReports.IMMEDIATE)
        .set_send_dom(True)
        .set_use_dom(True)
        .set_enable_patterns(True)
        .set_stitch_overlap(100)
        .set_api_key("api key")
        .set_server_url("https://server.url")
    )
    assert conf.batch == batch
    assert conf.server_url == "https://server.url"
    assert conf.api_key == "api key"
    assert conf.stitch_overlap == 100
    assert conf.enable_patterns == True
    assert conf.use_dom == True
    assert conf.send_dom == True
    assert conf.failure_reports == FailureReports.IMMEDIATE
    assert conf.save_failed_tests == True
    assert conf.save_new_tests == False
    assert conf.match_level == MatchLevel.EXACT
    assert conf.match_timeout == 100000
    assert conf.host_os == "host os"
    assert conf.host_app == "host app"
    assert conf.ignore_caret == False
    assert conf.session_type == SessionType.PROGRESSION
    assert conf.viewport_size == {"width": 400, "height": 300}
    assert conf.test_name == "test name"
    assert conf.app_name == "app name"
    assert conf.save_diffs == True
    assert conf.environment_name == "env name"
    assert conf.baseline_env_name == "baseline env name"
    assert conf.baseline_branch_name == "baseline branch name"
    assert conf.parent_branch_name == "parent branch name"
    assert conf.agent_id == "agent id"
    assert conf.branch_name == "branch name"


def test_set_value_to_sel_conf():
    conf = SeleniumConfiguration()
    conf.set_force_full_page_screenshot(True).set_wait_before_screenshots(
        10000000
    ).set_stitch_mode(StitchMode.CSS).set_hide_scrollbars(True).set_hide_caret(True)
    conf.set_disable_browser_fetching(True)
    conf.set_enable_cross_origin_rendering(False)
    conf.set_dont_use_cookies(True)
    conf.set_layout_breakpoints(True)
    conf.set_wait_before_capture(5)

    assert conf.force_full_page_screenshot == True
    assert conf.wait_before_screenshots == 10000000
    assert conf.stitch_mode == StitchMode.CSS
    assert conf.hide_scrollbars == True
    assert conf.hide_caret == True
    assert conf.disable_browser_fetching is True
    assert conf.enable_cross_origin_rendering is False
    assert conf.dont_use_cookies is True
    assert conf.layout_breakpoints is True
    assert conf.wait_before_capture == 5


def test_layout_breakpoints_list():
    conf = SeleniumConfiguration()
    conf.set_layout_breakpoints(1, 2, 3)

    assert conf.layout_breakpoints == [1, 2, 3]


def test_add_browser():
    conf = SeleniumConfiguration().add_browser(IosDeviceInfo("iPhone X", "portrait"))
    assert conf.browsers_info == [
        IosDeviceInfo(IosDeviceName.iPhone_X, ScreenOrientation.PORTRAIT)
    ]

    conf = SeleniumConfiguration().add_browser(
        ChromeEmulationInfo("iPhone 4", "portrait")
    )
    assert conf.browsers_info == [
        ChromeEmulationInfo(DeviceName.iPhone_4, ScreenOrientation.PORTRAIT)
    ]

    conf = (
        SeleniumConfiguration()
        .set_baseline_env_name("Default baseline")
        .add_browser(400, 600, BrowserType.EDGE_CHROMIUM, "Baseline")
        .add_browser(500, 600, BrowserType.SAFARI)
        .add_browser(500, 600, BrowserType.FIREFOX)
        .add_browser(DesktopBrowserInfo(400, 600, BrowserType.EDGE_CHROMIUM))
    )
    assert conf.browsers_info == [
        DesktopBrowserInfo(400, 600, BrowserType.EDGE_CHROMIUM, "Baseline"),
        DesktopBrowserInfo(500, 600, BrowserType.SAFARI, "Default baseline"),
        DesktopBrowserInfo(500, 600, BrowserType.FIREFOX, "Default baseline"),
        DesktopBrowserInfo(400, 600, BrowserType.EDGE_CHROMIUM),
    ]


def test_add_browsers():
    browsers = [
        IosDeviceInfo("iPhone X", "portrait"),
        IosDeviceInfo("iPhone 11", "landscape"),
        DesktopBrowserInfo(400, 600, BrowserType.EDGE_CHROMIUM),
    ]
    conf = SeleniumConfiguration().add_browsers(*browsers)
    assert conf.browsers_info == browsers

    conf = SeleniumConfiguration().add_browsers(browsers)
    assert conf.browsers_info == browsers


def test_config_cloning():
    conf = SeleniumConfiguration()
    conf.batch.add_property("some", "some val")
    conf.add_property("hello", "world")
    conf.set_viewport_size({"width": 200, "height": 400})
    conf.default_match_settings.content_regions.append(Region.EMPTY())
    conf.add_browser(200, 400, BrowserType.EDGE_CHROMIUM)
    conf.set_visual_grid_options(VisualGridOption("option1", "val"))

    cloned_conf = conf.clone()

    assert id(conf.batch.properties[0]) != id(cloned_conf.batch.properties[0])
    assert id(conf.properties[0]) != id(cloned_conf.properties[0])
    assert id(conf.default_match_settings.content_regions) != id(
        cloned_conf.default_match_settings.content_regions
    )
    assert id(conf.browsers_info[0]) != id(cloned_conf.browsers_info[0])
    assert id(conf.viewport_size) != id(cloned_conf.viewport_size)
    assert id(conf.visual_grid_options[0]) != id(cloned_conf.visual_grid_options[0])


def test_proxy_settings_from_host():
    ps = ProxySettings("localhost")

    assert ps.host == "localhost"
    assert ps.port == 8888
    assert ps.username is None
    assert ps.password is None
    assert ps.scheme == "http"


def test_proxy_settings_from_url():
    ps = ProxySettings("https://user:password@127.0.0.1:8000")

    assert ps.host == "127.0.0.1"
    assert ps.port == 8000
    assert ps.username == "user"
    assert ps.password == "password"
    assert ps.scheme == "https"


def test_proxy_settings_from_url_override_port():
    ps = ProxySettings("http://localhost", 8000)

    assert ps.host == "localhost"
    assert ps.port == 8000
    assert ps.username is None
    assert ps.password is None
    assert ps.scheme == "http"


def test_proxy_settings_url_port():
    ps = ProxySettings("localhost", 8080)

    assert ps.url == "http://localhost:8080"


def test_proxy_settings_url_auth():
    ps = ProxySettings("localhost", 8080, "user", "pass")

    assert ps.url == "http://user:pass@localhost:8080"


def test_proxy_settings_url_scheme():
    ps = ProxySettings("http://localhost")

    assert ps.url == "http://localhost:8888"


def test_proxy_settings_url_scheme_explicit():
    ps = ProxySettings("localhost", 8080, scheme="http")

    assert ps.url == "http://localhost:8080"
