const isCordovaRuntime = () => (
  import.meta.env.VITE_CORDOVA === 'true'
  || Boolean(window.cordova?.platformId)
  || document.documentElement.getAttribute('data-cordova') === 'true'
);

export const waitForCordovaReady = () => new Promise((resolve) => {
  if (!isCordovaRuntime()) {
    resolve();
    return;
  }

  if (window.cordova?.platformId) {
    resolve();
    return;
  }

  document.addEventListener('deviceready', () => resolve(), { once: true });
});

export const requestMeetingMediaPermissions = async () => {
  await waitForCordovaReady();

  const permissionsApi = window.cordova?.plugins?.permissions;
  if (!permissionsApi) {
    return true;
  }

  const permissionList = [
    permissionsApi.CAMERA,
    permissionsApi.RECORD_AUDIO,
    permissionsApi.MODIFY_AUDIO_SETTINGS,
  ].filter(Boolean);

  if (permissionList.length === 0) {
    return true;
  }

  const allGranted = async () => {
    for (const permission of permissionList) {
      const status = await new Promise((resolve, reject) => {
        permissionsApi.checkPermission(permission, resolve, reject);
      }).catch(() => ({ hasPermission: false }));

      if (!status?.hasPermission) {
        return false;
      }
    }
    return true;
  };

  if (await allGranted()) {
    return true;
  }

  const requestStatus = await new Promise((resolve, reject) => {
    permissionsApi.requestPermissions(permissionList, resolve, reject);
  }).catch(() => ({ hasPermission: false }));

  if (requestStatus?.hasPermission) {
    return true;
  }

  return await allGranted();
};
