from __future__ import absolute_import

import logging
from enum import Enum
from os import getcwd
from threading import Lock
from typing import TYPE_CHECKING, Any, List, Optional, Text

from ..common import TestResults
from ..common.errors import USDKFailure
from ..common.target import ImageTarget
from .connection import USDKConnection
from .schema import demarshal_error

if TYPE_CHECKING:
    from typing import Tuple, Type, Union

    from ..common.selenium import Configuration
    from ..common.utils.custom_types import ViewPort
    from ..core import TextRegionSettings, VisualLocatorSettings
    from ..core.batch_close import _EnabledBatchClose  # noqa
    from ..core.extract_text import OCRRegion
    from .command_context import CommandContext
    from .fluent import SeleniumCheckSettings
    from .optional_deps import WebDriver
    from .protocol import USDKProtocol

logger = logging.getLogger(__name__)

Failure = USDKFailure  # backward compatibility with eyes-selenium==5.0.0


class ManagerType(Enum):
    UFG = "ufg"
    CLASSIC = "classic"


class CommandExecutor(object):
    @classmethod
    def create(cls, protocol, name, version):
        # type: (Type[USDKProtocol], Text, Text) -> CommandExecutor
        commands = cls(protocol, USDKConnection.create())
        commands.make_core(name, version, getcwd())
        return commands

    @classmethod
    def get_instance(cls, protocol, name, version):
        # type: (Type[USDKProtocol], Text, Text) -> CommandExecutor
        with _instances_lock:
            key = (protocol, name, version)
            if key in _instances:
                return _instances[key]
            else:
                return _instances.setdefault(key, cls.create(*key))

    def __init__(self, protocol, connection):
        # type: (Type[USDKProtocol], USDKConnection) -> None
        self._protocol = protocol
        self._connection = connection

    def make_core(self, name, version, cwd):
        # type: (Text, Text, Text) -> None
        self._connection.notification(
            "Core.makeCore",
            {
                "name": name,
                "version": version,
                "cwd": cwd,
                "protocol": self._protocol.KIND,
                "commands": self._protocol.COMMANDS,
            },
        )

    def core_make_manager(
        self, manager_type, concurrency=None, legacy_concurrency=None, agent_id=None
    ):
        # type: (ManagerType, Optional[int], Optional[int], Optional[Text]) -> dict
        context = self._protocol.context(self._connection)
        payload = {"type": manager_type.value}
        if concurrency is not None:
            payload["concurrency"] = concurrency
        if legacy_concurrency is not None:
            payload["legacyConcurrency"] = legacy_concurrency
        if agent_id is not None:
            payload["agentId"] = agent_id
        return self._checked_command(context, "Core.makeManager", payload)

    def core_get_viewport_size(self, driver):
        # type: (WebDriver) -> dict
        context = self._protocol.context(self._connection)
        m = context.marshaller
        target = m.marshal_webdriver_ref(driver)
        return self._checked_command(
            context, "Core.getViewportSize", {"target": target}
        )

    def core_set_viewport_size(self, driver, size):
        # type: (WebDriver, ViewPort) -> None
        context = self._protocol.context(self._connection)
        m = context.marshaller
        target = m.marshal_webdriver_ref(driver)
        self._checked_command(
            context,
            "Core.setViewportSize",
            {"target": target, "size": m.marshal_viewport_size(size)},
        )

    def core_close_batch(self, close_batch_settings):
        # type: (_EnabledBatchClose) -> None
        context = self._protocol.context(self._connection)
        m = context.marshaller
        settings = []
        for batch_id in close_batch_settings._ids:  # noqa
            close_batch_settings.batch_id = batch_id
            settings.append(m.marshal_enabled_batch_close(close_batch_settings))
        self._checked_command(context, "Core.closeBatch", {"settings": settings})

    def core_delete_test(self, test_results):
        # type: (TestResults) -> None
        context = self._protocol.context(self._connection)
        m = context.marshaller
        settings = m.marshal_delete_test_settings(test_results)
        self._checked_command(context, "Core.deleteTest", {"settings": settings})

    def manager_open_eyes(self, manager, target=None, config=None):
        # type: (dict, Optional[WebDriver], Optional[Configuration]) -> dict
        context = self._protocol.context(self._connection)
        m = context.marshaller
        payload = {"manager": manager}
        if target is not None:
            payload["target"] = m.marshal_webdriver_ref(target)
        if config is not None:
            payload["config"] = m.marshal_configuration(config)
        return self._checked_command(context, "EyesManager.openEyes", payload)

    def manager_close_manager(self, manager, raise_ex, timeout):
        # type: (dict, bool, float) -> List[dict]
        context = self._protocol.context(self._connection)
        return self._checked_command(
            context,
            "EyesManager.closeManager",
            {"manager": manager, "settings": {"throwErr": raise_ex}},
            wait_timeout=timeout,
        )

    def eyes_check(
        self,
        eyes,  # type: dict
        target,  # type: Union[WebDriver, ImageTarget]
        settings,  # type: SeleniumCheckSettings
        config,  # type: Configuration
    ):
        # type: (...) -> dict
        context = self._protocol.context(self._connection)
        m = context.marshaller
        payload = {
            "eyes": eyes,
            "settings": m.marshal_check_settings(settings),
            "config": m.marshal_configuration(config),
        }
        if isinstance(target, ImageTarget):
            payload["target"] = m.marshal_image_target(target)
        else:
            payload["target"] = m.marshal_webdriver_ref(target)
        return self._checked_command(context, "Eyes.check", payload)

    def core_locate(self, target, settings, config):
        # type: (WebDriver, VisualLocatorSettings, Configuration) -> dict
        context = self._protocol.context(self._connection)
        m = context.marshaller
        payload = {
            "target": m.marshal_webdriver_ref(target),
            "settings": m.marshal_locate_settings(settings),
            "config": m.marshal_configuration(config),
        }
        return self._checked_command(context, "Core.locate", payload)

    def eyes_extract_text(
        self,
        eyes,  # type: dict
        target,  # type: Union[WebDriver, ImageTarget]
        settings,  # type: Tuple[OCRRegion]
        config,  # type: Configuration
    ):
        # type: (...) -> List[Text]
        context = self._protocol.context(self._connection)
        m = context.marshaller
        payload = {
            "eyes": eyes,
            "settings": m.marshal_ocr_extract_settings(settings),
            "config": m.marshal_configuration(config),
        }
        if isinstance(target, ImageTarget):
            payload["target"] = m.marshal_image_target(target)
        else:
            payload["target"] = m.marshal_webdriver_ref(target)
        return self._checked_command(context, "Eyes.extractText", payload)

    def eyes_locate_text(
        self,
        eyes,  # type: dict
        target,  # type: Union[WebDriver, ImageTarget]
        settings,  # type: TextRegionSettings
        config,  # type: Configuration
    ):
        # type: (...) -> dict
        context = self._protocol.context(self._connection)
        m = context.marshaller
        payload = {
            "eyes": eyes,
            "settings": m.marshal_ocr_search_settings(settings),
            "config": m.marshal_configuration(config),
        }
        if isinstance(target, ImageTarget):
            payload["target"] = m.marshal_image_target(target)
        else:
            payload["target"] = m.marshal_webdriver_ref(target)
        return self._checked_command(context, "Eyes.locateText", payload)

    def eyes_close_eyes(self, eyes, throw_err, config, wait_result):
        # type: (dict, bool, Configuration, bool) -> List[dict]
        context = self._protocol.context(self._connection)
        m = context.marshaller
        payload = {
            "eyes": eyes,
            "settings": {"throwErr": throw_err},
            "config": m.marshal_configuration(config),
        }
        return self._checked_command(context, "Eyes.close", payload, wait_result)

    def eyes_abort_eyes(self, eyes, wait_result):
        # type: (dict, bool) -> List[dict]
        context = self._protocol.context(self._connection)
        return self._checked_command(context, "Eyes.abort", {"eyes": eyes}, wait_result)

    def server_get_info(self):
        # type: () -> dict
        context = self._protocol.context(self._connection)
        return self._checked_command(context, "Server.getInfo", {})

    def _checked_command(
        self, command_context, name, payload, wait_result=True, wait_timeout=9 * 60
    ):
        # type: (CommandContext, Text, dict, bool, float) -> Optional[Any]
        response = self._connection.command(
            command_context, name, payload, wait_result, wait_timeout
        )
        if wait_result:
            response_payload = response["payload"]
            _check_error(response_payload)
            return response_payload.get("result")
        else:
            return None


def _check_error(payload):
    # type: (dict) -> None
    error = payload.get("error")
    if error:
        usdk_error = demarshal_error(error)
        logger.error("Re-raising an error received from SDK server: %r", usdk_error)
        raise usdk_error


_instances = {}
_instances_lock = Lock()
