from .optional_deps import WebDriver, WebElement


class ObjectRegistry(object):
    def marshal_driver(self, driver):
        raise NotImplementedError

    def marshal_element(self, element):
        raise NotImplementedError


class SeleniumWebdriverObjectRegistry(object):
    def marshal_driver(self, driver):
        # type: (WebDriver) -> dict
        return {
            "sessionId": driver.session_id,
            "serverUrl": driver.command_executor._url,
            "capabilities": driver.capabilities,
        }

    def marshal_element(self, element):
        # type: (WebElement) -> dict
        return {"elementId": element._id}
