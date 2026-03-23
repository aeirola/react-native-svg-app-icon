# Android Legacy Icons

Originally Android App icons have been square images. In Android 7.1 there was a short idea about round images. Finally in Android 8.0 Adaptive Icons were introduced which is the current default. Modern apps should still support older versions of android, and provide compatible icons for them.

There are many different guides and implementations for Android Legacy icons. For example Material Design 2 has guides for [Android Icons](https://m2.material.io/design/platform-guidance/android-icons.html) and [Product Icons](https://m2.material.io/design/iconography/product-icons.html) which specify sizing and lighting.

For our implementation we follow the official [Android Developer guide](https://developer.android.com/studio/write/create-app-icons#launcher) that encourages use of the Android Studio Image Asset Studio tool. It is probably the most common way applications generate their icons, which produces some consistency in android launchers. Thus we attempt to implement similar behaviour in our code, even though it might differ from the design guidelines.

The asset studio is fortunately open sourced [at Google Git](https://android.googlesource.com/platform/tools/adt/idea/+/refs/tags/studio-2025.3.1/android-npw/src/com/android/tools/idea/npw/assetstudio), with image layers [available as well](https://android.googlesource.com/platform/tools/adt/idea/+/refs/tags/studio-2025.3.1/android/resources/images/launcher_stencil).
