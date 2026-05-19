import Toast from 'react-native-toast-message';

const toastConfig = {
  success: (internal: any) => Toast.show({
    type: 'success',
    text1: internal.text1,
    text2: internal.text2,
    visibilityTime: 3000,
    position: 'top',
  }),
  error: (internal: any) => Toast.show({
    type: 'error',
    text1: internal.text1,
    text2: internal.text2,
    visibilityTime: 4000,
    position: 'top',
  }),
  info: (internal: any) => Toast.show({
    type: 'info',
    text1: internal.text1,
    text2: internal.text2,
    visibilityTime: 3000,
    position: 'top',
  }),
};

export { Toast, toastConfig };
