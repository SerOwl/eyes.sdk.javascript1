from .optional_deps import WebDriver


class ObjectRegistry(object):
    def marshal_driver(self, driver):
        raise NotImplementedError


class SeleniumWebdriverObjectRegistry(object):
    def marshal_driver(self, driver):
        # type: (WebDriver) -> dict
        return {
            "sessionId": driver.session_id,
            "serverUrl": driver.command_executor._url,
            "capabilities": driver.capabilities,
        }
