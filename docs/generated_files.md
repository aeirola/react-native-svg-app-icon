# Generated images

All icon images are generated from a single source file, with an optional background, but are processed in different ways to produce optimal results for eacth platform and device.

This document describes how the different images are being produced.

## Android

Android icons consist of the newer [adaptive icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive) for Android 8.0+, and the [legacy](https://material.io/design/iconography/product-icons.html) round and square icons for older versions of the platform.

### Adaptive icon

Adaptive icons consist of a partially transparent foreground layer and solid background layer, which are rendered on top of each other to produce a final icon. This enables interesting parallax effects in Android launchers which support it.

This foreground and background layers are generated as vector drawable icons when possible, with fallback to PNG images in case the SVG source images contains incompatible content.

Regardless of the generated layer formats, the adaptive icon file is produced which specifies the correct background and foreground layers:

`mipmap-anydpi-v26/ic_launcher.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
```

#### Vector drawable foreground

The foreground is generated as a [vector drawable](https://developer.android.com/guide/topics/graphics/vector-drawable-resources) for simple SVG input where all the visual content can be represented as vector drawable elements. For a full list of supported elements in the vector drawable specification, see the [reference](https://developer.android.com/reference/android/graphics/drawable/VectorDrawable.html) documentation.

Vector drawable icons are generated using the [svg2vectordrawable](https://github.com/Ashung/svg2vectordrawable) library. In case there are problems with the output vector drawable, please check for information in that library.

`drawable-anydpi-v26/ic_launcher_foreground.xml`

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#222"
        android:pathData="M0 0h108v108H0V0z"/>
    <path
        android:fillColor="#FFF"
        android:pathData="M58.83 53.83a4..."/>
    <path
        android:fillColor="#FFF"
        android:pathData="M80 53.83c0-3...."/>
</vector>
```

#### PNG fallback foreground

In case the input SVG contains elements not supported by vector drawable, such as `<text>`, then the foreground is rendered as a normal PNG images for each density, which would look like this:

![Android adaptive foreground](../src/__tests__/fixtures/example/icon.svg)

### Legacy icons

Traditional Android launcher icons have lacked enforced design guidelines, and are allowed to have basically any shape. Here, the icons are generated similarly to the [Image asset studio](https://developer.android.com/studio/write/image-asset-studio) with cropping and shading applied according to the [Material design](https://material.io/design/iconography/) guidelines. This means that there is an appropriate transparent margin around the icons, with drop shadows added to mimic

PNG icons are generated for all different [densities](https://developer.android.com/training/multiscreen/screendensities.html#TaskProvideAltBmp), from `mdpi` to `xxxhdpi`.

#### Square

Normal legacy icons supported by all Android versions.

`mipmap-*dpi/ic_launcher.png`

![Android xxxhdpi legacy square](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png)
![Android xxhdpi legacy square](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png)
![Android xhdpi legacy square](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png)
![Android hdpi legacy square](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-hdpi/ic_launcher.png)
![Android mdpi legacy square](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-mdpi/ic_launcher.png)

#### Round

Android 7.1 included support for defining specifically circular launcher icons. These are rendered separately from the square format for consistent style on all platforms.

`mipmap-*dpi/ic_launcher_round.png`

![Android xxxhdpi legacy round](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png)
![Android xxhdpi legacy round](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png)
![Android xhdpi legacy round](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png)
![Android hdpi legacy round](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png)
![Android mdpi legacy round](../src/__tests__/fixtures/example/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png)



## iOS

All iOS images follow the same square cropped shape without any transparency, with rounder corners produced by the platform. The source image is cropped according to the Android adaptive icon viewport (center 2/3), providing consistent icons across all platforms.

Launcher, settings and spotlight icons are generated for all devices supported by React Native, meaning iPhones and iPads running iOS 9 or later.

### iPhone

![iOS iPhone icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/iphone-60@3x.png)
![iOS iPhone icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/iphone-60@2x.png)
![iOS iPhone icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/iphone-40@3x.png)
![iOS iPhone icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/iphone-29@3x.png)
![iOS iPhone icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/iphone-40@2x.png)
![iOS iPhone icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/iphone-20@3x.png)
![iOS iPhone icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/iphone-29@2x.png)
![iOS iPhone icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/iphone-20@2x.png)

### iPad

![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-83.5@2x.png)
![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-76@2x.png)
![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-40@2x.png)
![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-76@1x.png)
![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-29@2x.png)
![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-40@1x.png)
![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-20@2x.png)
![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-29@1x.png)
![iOS iPad icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ipad-20@1x.png)

### Marketing icon

![iOS marketing icon](../src/__tests__/fixtures/example/ios/example/Images.xcassets/AppIcon.appiconset/ios-marketing-1024@1x.png)
