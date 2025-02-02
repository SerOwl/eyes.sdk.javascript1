import os
import sys
import uuid
import warnings

# Outdated versions of these modules have invalid escape sequences
# in some docstrings. To ignore these irrelevant warnings import modules early
# having filter in place.
# Warnings are only issued during module interpretation, it is not
# issued when cached bytecode is found and loaded by the interpreter.
# Make sure to wipe cached bytecode when verifying that modules still
# produce these warnings.
with warnings.catch_warnings():
    warnings.filterwarnings("ignore", "invalid escape", category=DeprecationWarning)
    import selenium.webdriver

from selenium.common.exceptions import WebDriverException

# Generate APPLITOOLS_BATCH_ID for xdist run in case it was not provided externally
os.environ["APPLITOOLS_BATCH_ID"] = os.getenv("APPLITOOLS_BATCH_ID", str(uuid.uuid4()))
# Keep batch open after runner termination
os.environ["APPLITOOLS_DONT_CLOSE_BATCHES"] = "true"

from applitools.selenium import BatchInfo, Eyes, StitchMode

from .browsers import *
from .devices import *
from .sauce import pytest_collection_modifyitems, sauce_url


@pytest.fixture(scope="session")
def batch_info():
    return BatchInfo(
        "Python {}.{} Generated tests".format(
            sys.version_info.major, sys.version_info.minor
        )
    )


@pytest.fixture(scope="function")
def name_of_test(request):
    return "Python {}".format(request.node.name)


@pytest.fixture(scope="function")
def eyes_runner_class():
    return None


@pytest.fixture(scope="function")
def legacy():
    return False


@pytest.fixture(scope="function")
def execution_grid():
    return False


@pytest.fixture(scope="function")
def driver_builder(chrome):
    return chrome


@pytest.fixture(name="driver", scope="function")
def driver_setup(driver_builder):
    # supported browser types
    #     "Appium": appium,
    #     "Chrome": chrome,
    #     "Firefox": firefox,
    #     "Firefox48": firefox48,
    #     "IE11": ie11,
    #     "Edge": edge,
    #     "Safari11": safari11,
    #     "Safari12": safari12,
    #     "ChromeEmulator": chrome_emulator,
    #

    driver = driver_builder
    yield driver
    # Close the browser.
    try:
        if driver is not None:
            driver.quit()
    except WebDriverException:
        print("Driver was already closed")


@pytest.fixture(name="runner", scope="function")
def runner_setup(eyes_runner_class):
    runner = eyes_runner_class
    yield runner


#     all_test_results = runner.get_all_test_results()
#     print(all_test_results)


@pytest.fixture(scope="function")
def stitch_mode():
    return StitchMode.Scroll


@pytest.fixture(scope="function")
def emulation():
    is_emulation = False
    orientation = ""
    page = ""
    return is_emulation, orientation, page


@pytest.fixture(name="eyes", scope="function")
def eyes_setup(runner, batch_info, stitch_mode, emulation):
    """
    Basic Eyes setup. It'll abort test if wasn't closed properly.
    """
    eyes = Eyes(runner)
    # Initialize the eyes SDK and set your private API key.
    eyes.api_key = os.environ["APPLITOOLS_API_KEY"]
    eyes.configure.batch = batch_info
    eyes.configure.branch_name = "master"
    eyes.configure.parent_branch_name = "master"
    eyes.configure.set_stitch_mode(stitch_mode)
    eyes.configure.set_save_new_tests(False)
    eyes.configure.set_hide_caret(True)
    eyes.configure.set_hide_scrollbars(True)
    is_emulation, orientation, page = emulation
    if is_emulation:
        eyes.add_property("Orientation", orientation)
        eyes.add_property("Page", page)
    yield eyes
    # If the test was aborted before eyes.close was called, ends the test as aborted.
    eyes.abort()
    if runner is not None:
        runner.get_all_test_results(False)
