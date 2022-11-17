var port = chrome.runtime.connect({name: 'applitools-collab-open-sesame'});

const flag = document.createElement('div')
flag.style.display = 'none'
flag.id = 'applitools-collab-extension-loaded'
document.body.appendChild(flag)

window.addEventListener('message', (event) => {
  // We only accept messages from ourselves
  if (event.source != window) {
    return;
  }

  if (event.data.type && (event.data.type == 'FROM_PAGE')) {
    console.log('Content script received: ' + event.data.text);
    console.log('event data', event.data)
    port.postMessage(event.data);
  }
}, false);
