/* eslint-disable no-restricted-globals */
self.onmessage = function (e) {
  if (e.data === "start") {
    if (self.timerId) clearInterval(self.timerId);
    self.timerId = setInterval(() => {
      self.postMessage("tick");
    }, 1000);
  } else if (e.data === "stop") {
    if (self.timerId) clearInterval(self.timerId);
  }
};
