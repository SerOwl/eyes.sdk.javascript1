import base64
import re
from itertools import count
from json import JSONDecodeError, dumps, loads
from typing import TYPE_CHECKING

from .marshaller import Marshaller
from .object_registry import (
    ObjectRegistry,
    PlaywrightSpecDriverObjectRegistry,
    SeleniumWebdriverObjectRegistry,
)

if TYPE_CHECKING:
    from .connection import USDKConnection


class CommandContext(object):
    OBJECT_REGISTRY = ObjectRegistry
    _key_gen = count(1)

    def __init__(self, connection):
        # type: (USDKConnection) -> None
        self._connection = connection
        self.key = str(next(self._key_gen))
        self.object_registry = self.OBJECT_REGISTRY(self.key)
        self.marshaller = Marshaller(self.object_registry)

    def execute_callback(self, command):
        name, key = command["name"], command["key"]
        result = self._select_callback(name, command.get("payload"))
        self._connection.response(key, name, result)

    def _select_callback(self, name, payload):
        if name == "Driver.executeScript":
            page = self.object_registry.demarshal_driver(payload["context"])
            arg = self._demarshal_script_args(payload.get("arg", []))
            res = page.evaluate_handle(payload["script"], arg)
            ho = self._handle_to_object(res)
            if ho is not None and type(ho) != str:
                ho = dumps(ho)
            return ho
        elif name == "Driver.mainContext":
            page = self.object_registry.demarshal_driver(payload["context"])
            return self.object_registry.marshal_driver(page.main_frame)
        elif name == "Driver.findElement":
            page = self.object_registry.demarshal_driver(payload["context"])
            selector = payload["selector"]
            if type(selector) is str:
                locator = page.locator(selector)
            else:
                locator = page.locator(selector["selector"])
            handle = locator.element_handle()
            return self.object_registry.marshal_element(handle)
        elif name == "Driver.takeScreenshot":
            page = self.object_registry.demarshal_driver(payload["driver"])
            screenshot = page.screenshot()
            return base64.b64encode(screenshot).decode()
        elif name == "Driver.getTitle":
            page = self.object_registry.demarshal_driver(payload["driver"])
            return page.title()
        elif name == "Driver.getUrl":
            page = self.object_registry.demarshal_driver(payload["driver"])
            return page.url
        elif name == "Driver.getDriverInfo":
            return {
                "features": {"allCookies": True, "canExecuteOnlyFunctionScripts": True}
            }
        elif name == "Driver.getViewportSize":
            page = self.object_registry.demarshal_driver(payload["driver"])
            return page.viewport_size
        elif name == "Driver.setViewportSize":
            page = self.object_registry.demarshal_driver(payload["driver"])
            return page.set_viewport_size(payload["size"])
        else:
            raise RuntimeError("Unexpected command", name)

    def _handle_to_object(self, handle):
        m = re.match(r"(?:.+@)?(\w*)(?:\(\d+\))?", str(handle), re.IGNORECASE)
        if m:
            type = m.groups()[-1].lower()
        else:
            type = None
        if type == "array":
            props = handle.get_properties()
            return [self._handle_to_object(o) for o in props.values()]
        if type == "object":
            props = handle.get_properties()
            return {k: self._handle_to_object(v) for k, v in props.items()}
        elif str(handle).startswith("JSHandle@"):
            element = handle.as_element()
            return self.object_registry.marshal_node(element)
        return handle.json_value()

    def _demarshal_script_args(self, args):
        res = []
        for arg in args:
            if isinstance(arg, str):
                try:
                    json = loads(arg)
                except JSONDecodeError:
                    json = arg
            else:
                json = arg
            if isinstance(json, dict) and "applitools-ref-id" in json:
                res.append(self.object_registry.demarshal_node(json))
            else:
                res.append(arg)
        return res


class SeleniumWebdriverCommandContext(CommandContext):
    OBJECT_REGISTRY = SeleniumWebdriverObjectRegistry


class PlaywrightSpecDriverCommandContext(CommandContext):
    OBJECT_REGISTRY = PlaywrightSpecDriverObjectRegistry
