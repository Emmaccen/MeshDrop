export async function tryAFewTimes<T>(
  condition: () => T,
  timeout = 5000,
  interval = 100
): Promise<T> {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const tryAgain = () => {
      const conditionMet = condition();

      if (conditionMet) return resolve(conditionMet);

      if (Date.now() - start > timeout) {
        return reject(new Error("Timeout waiting for state condition"));
      }

      setTimeout(tryAgain, interval);
    };

    tryAgain();
  });
}
