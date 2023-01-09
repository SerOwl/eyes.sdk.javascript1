from itertools import count
from typing import TYPE_CHECKING

from .optional_deps import WebDriver, WebElement

if TYPE_CHECKING:
    from typing import Text


class ObjectRegistry(object):
    def __init__(self, command_key):
        # type: (Text) -> None
        self._command_key = command_key

    def marshal_driver(self, driver):
        raise NotImplementedError

    def marshal_element(self, element):
        raise NotImplementedError


class SeleniumWebdriverObjectRegistry(ObjectRegistry):
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


class PlaywrightSpecDriverObjectRegistry(ObjectRegistry):
    def __init__(self, command_key):
        # type: (Text) -> None
        super(PlaywrightSpecDriverObjectRegistry, self).__init__(command_key)
        self._objects = []

    def marshal_driver(self, driver):
        return {"applitools-ref-id": self._obj2id(driver)}

    def demarshal_driver(self, obj):
        return self._id2obj(obj["applitools-ref-id"])

    def marshal_element(self, element):
        res = {"applitools-ref-id": self._obj2id(element), "type": "element"}
        return res

    def demarshal_element(self, obj):
        return self._id2obj(obj["applitools-ref-id"])

    def marshal_node(self, node):
        res = {"applitools-ref-id": self._obj2id(node), "type": "element"}
        return res

    def demarshal_node(self, obj):
        return self._id2obj(obj["applitools-ref-id"])

    def _obj2id(self, object):
        # type: (object) -> Text
        try:
            idx = self._objects.index(object)
        except ValueError:
            self._objects.append(object)
            idx = len(self._objects) - 1
        return "-".join((self._command_key, str(idx)))

    def _id2obj(self, objid):
        # type: (Text) -> object
        command_key, idx = objid.split("-")
        assert command_key == self._command_key
        return self._objects[int(idx)]
