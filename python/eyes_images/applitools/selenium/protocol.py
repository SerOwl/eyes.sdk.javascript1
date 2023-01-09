from typing import TYPE_CHECKING

from .command_context import (
    PlaywrightSpecDriverCommandContext,
    SeleniumWebdriverCommandContext,
)

if TYPE_CHECKING:
    from .connection import USDKConnection


class USDKProtocol(object):
    KIND = None
    COMMANDS = None
    COMMAND_CONTEXT = None

    @classmethod
    def context(cls, connection):
        # type: (USDKConnection) -> None
        return cls.COMMAND_CONTEXT(connection)


class SeleniumWebDriver(USDKProtocol):
    KIND = "webdriver"
    COMMAND_CONTEXT = SeleniumWebdriverCommandContext


class PlaywrightSpecDriver(USDKProtocol):
    KIND = "specdriver"
    COMMANDS = [
        "isDriver",
        "isElement",
        "isSelector",
        "executeScript",
        "mainContext",
        "findElement",
        "takeScreenshot",
        "getTitle",
        "getUrl",
        "getDriverInfo",
        "getViewportSize",
        "setViewportSize",
    ]
    COMMAND_CONTEXT = PlaywrightSpecDriverCommandContext
