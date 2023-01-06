from .command_context import SeleniumWebdriverCommandContext


class USDKProtocol(object):
    KIND = None
    COMMANDS = None
    COMMAND_CONTEXT = None

    @classmethod
    def context(cls):
        return cls.COMMAND_CONTEXT()


class SeleniumWebDriver(USDKProtocol):
    KIND = "webdriver"
    COMMAND_CONTEXT = SeleniumWebdriverCommandContext
