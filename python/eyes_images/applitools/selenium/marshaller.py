from typing import TYPE_CHECKING

from .schema import (
    CheckSettings,
    CloseBatchSettings,
    CloseSettings,
    DeleteTestSettings,
    ExtractTextSettings,
    EyesConfig,
    ImageTarget,
    LocateSettings,
    OCRSearchSettings,
    OpenSettings,
    Size,
    StaticDriver,
)
from .schema_fields import check_error

if TYPE_CHECKING:
    from typing import List, Tuple

    from .. import common
    from ..common import config as cfg
    from ..common import target as t
    from ..common.utils.custom_types import ViewPort
    from ..core import extract_text, locators
    from ..core.batch_close import _EnabledBatchClose  # noqa
    from .fluent import selenium_check_settings as cs
    from .object_registry import ObjectRegistry
    from .optional_deps import WebDriver


class Marshaller(object):
    def __init__(self, object_registry):
        # type: (ObjectRegistry) -> None
        self._object_registry = object_registry

    def marshal_viewport_size(self, viewport_size):
        # type: (ViewPort) -> dict
        return check_error(Size().dump(viewport_size))

    def marshal_webdriver_ref(self, driver):
        # type: (WebDriver) -> dict
        return check_error(StaticDriver().dump(driver))

    def marshal_enabled_batch_close(self, close_batches):
        # type: (_EnabledBatchClose) -> dict
        return check_error(CloseBatchSettings().dump(close_batches))

    def marshal_delete_test_settings(self, test_results):
        # type: (common.TestResults) -> dict
        return check_error(DeleteTestSettings().dump(test_results))

    def marshal_configuration(self, configuration):
        # type: (cfg.Configuration) -> dict
        open = check_error(OpenSettings().dump(configuration))
        config = check_error(EyesConfig().dump(configuration))
        close = check_error(CloseSettings().dump(configuration))
        return {"open": open, "screenshot": config, "check": config, "close": close}

    def marshal_check_settings(self, check_settings):
        # type: (cs.SeleniumCheckSettings) -> dict
        return check_error(CheckSettings().dump(check_settings.values))

    def marshal_image_target(self, image_target):
        # type: (t.ImageTarget) -> dict
        return check_error(ImageTarget().dump(image_target))

    def marshal_locate_settings(self, locate_settings):
        # type: (locators.VisualLocatorSettings) -> dict
        return check_error(LocateSettings().dump(locate_settings.values))

    def marshal_ocr_extract_settings(self, extract_settings):
        # type: (Tuple[extract_text.OCRRegion, ...]) -> List[dict]
        return [check_error(ExtractTextSettings().dump(s)) for s in extract_settings]

    def marshal_ocr_search_settings(self, search_settings):
        # type: (extract_text.TextRegionSettings) -> dict
        return check_error(OCRSearchSettings().dump(search_settings))
