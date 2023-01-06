from .marshaller import Marshaller
from .object_registry import ObjectRegistry, SeleniumWebdriverObjectRegistry


class CommandContext(object):
    OBJECT_REGISTRY = ObjectRegistry

    def __init__(self):
        self.object_registry = self.OBJECT_REGISTRY()
        self.marshaller = Marshaller(self.object_registry)


class SeleniumWebdriverCommandContext(CommandContext):
    OBJECT_REGISTRY = SeleniumWebdriverObjectRegistry
